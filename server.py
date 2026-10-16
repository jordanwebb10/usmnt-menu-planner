import io
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

BASE_DIR = Path(__file__).resolve().parent
STATE_FILE = BASE_DIR / "saved_menu_state.json"

class MenuPlannerHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/state":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            if STATE_FILE.exists():
                self.wfile.write(STATE_FILE.read_bytes())
            else:
                self.wfile.write(b'{"hasSaved": false}')
            return

        if parsed.path == "/api/export.xlsx":
            self.handle_export_xlsx()
            return

        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length > 0 else b"{}"

        if parsed.path == "/api/state":
            try:
                data = json.loads(body.decode("utf-8"))
                STATE_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"ok": true}')
            except Exception as e:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": False, "error": str(e)}).encode("utf-8"))
            return

        if parsed.path == "/api/reset":
            if STATE_FILE.exists():
                STATE_FILE.unlink()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"ok": true}')
            return

        if parsed.path == "/api/export.xlsx":
            self.handle_export_xlsx(body)
            return

        self.send_response(404)
        self.end_headers()

    def handle_export_xlsx(self, body=None):
        try:
            if body:
                payload = json.loads(body.decode("utf-8"))
            elif STATE_FILE.exists():
                payload = json.loads(STATE_FILE.read_text(encoding="utf-8"))
            else:
                payload = None

            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "MNT Nov 2026 Menu"

            navy_fill = PatternFill("solid", fgColor="0F1D3A")
            red_fill = PatternFill("solid", fgColor="991B1B")
            sec_fill = PatternFill("solid", fgColor="1E293B")
            theme_fill = PatternFill("solid", fgColor="FEF3C7")
            zebra_fill = PatternFill("solid", fgColor="F8FAFC")
            white_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
            bold_font = Font(name="Calibri", size=10, bold=True, color="0F172A")
            reg_font = Font(name="Calibri", size=10, color="1E293B")
            thin_border = Border(
                left=Side(style="thin", color="CBD5E1"),
                right=Side(style="thin", color="CBD5E1"),
                top=Side(style="thin", color="CBD5E1"),
                bottom=Side(style="thin", color="CBD5E1"),
            )

            days = payload.get("days", []) if payload else []
            rows = payload.get("excelRows", []) if payload else []

            ws.cell(1, 1, "MNT November 2026 Camp").font = Font(name="Calibri", size=14, bold=True, color="0F1D3A")
            ws.cell(2, 1, "Section").font = white_font
            ws.cell(2, 2, "Category / Line").font = white_font
            ws.cell(2, 1).fill = navy_fill
            ws.cell(2, 2).fill = navy_fill

            for idx, d in enumerate(days):
                col = 3 + idx
                c1 = ws.cell(1, col, d.get("gameHeader") or d.get("md", ""))
                c2 = ws.cell(2, col, f"{d.get('fullDate', d.get('short', ''))}\n({d.get('city', '')})")
                is_match = d.get("type") == "match"
                c1.fill = red_fill if is_match else sec_fill
                c1.font = white_font
                c1.alignment = Alignment(horizontal="center", vertical="center")
                c2.fill = navy_fill
                c2.font = white_font
                c2.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
                ws.column_dimensions[get_column_letter(col)].width = 28

            ws.column_dimensions["A"].width = 16
            ws.column_dimensions["B"].width = 26
            ws.row_dimensions[2].height = 34

            current_sec = None
            for r_i, row_obj in enumerate(rows):
                excel_r = 3 + r_i
                sec = row_obj.get("section", "")
                cat = row_obj.get("label", row_obj.get("category", ""))
                c_sec = ws.cell(excel_r, 1, sec if sec != current_sec else "")
                current_sec = sec
                c_cat = ws.cell(excel_r, 2, cat)
                c_sec.font = bold_font
                c_cat.font = bold_font
                c_sec.border = thin_border
                c_cat.border = thin_border

                is_theme = row_obj.get("isTheme", False)
                is_meta = row_obj.get("isMeta", False)

                for d_i, val in enumerate(row_obj.get("cells", [])):
                    cell = ws.cell(excel_r, 3 + d_i, val or "")
                    cell.alignment = Alignment(vertical="center", wrap_text=True)
                    cell.border = thin_border
                    if is_theme:
                        cell.fill = theme_fill
                        cell.font = bold_font
                    elif is_meta:
                        cell.fill = zebra_fill
                        cell.font = bold_font
                    else:
                        cell.font = reg_font
                        if r_i % 2 == 1:
                            cell.fill = zebra_fill
                ws.row_dimensions[excel_r].height = 26

            ws.freeze_panes = "C3"

            buf = io.BytesIO()
            wb.save(buf)
            xlsx_bytes = buf.getvalue()

            self.send_response(200)
            self.send_header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            self.send_header("Content-Disposition", 'attachment; filename="USMNT_Nov_2026_Menu_Plan.xlsx"')
            self.send_header("Content-Length", str(len(xlsx_bytes)))
            self.end_headers()
            self.wfile.write(xlsx_bytes)
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(str(e).encode("utf-8"))

import socket

class DualStackServer(ThreadingHTTPServer):
    address_family = socket.AF_INET6

    def server_bind(self):
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        return super().server_bind()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8090))
    try:
        server = DualStackServer(("::", port), MenuPlannerHandler)
    except Exception:
        server = ThreadingHTTPServer(("0.0.0.0", port), MenuPlannerHandler)
    print(f"USMNT Menu Planner Server listening on port {port} (IPv4 + IPv6)", flush=True)
    server.serve_forever()
