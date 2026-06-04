"""Assemble the single-file index.html from build/template.html + build/lektion*.js
Each lesson module is injected as its OWN <script> tag, so a syntax error in one
lesson cannot break the others. Run: python assemble.py
"""
import os, re, glob

ROOT = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(ROOT, "build")

def main():
    with open(os.path.join(BUILD, "template.html"), encoding="utf-8") as f:
        tpl = f.read()

    placeholder = "<script>\n/*__LESSON_MODULES__*/\n</script>"
    if placeholder not in tpl:
        raise SystemExit("ERROR: lesson-module placeholder not found in template.html")

    parts = []
    found = []
    for i in range(1, 9):
        p = os.path.join(BUILD, f"lektion{i}.js")
        if os.path.exists(p):
            with open(p, encoding="utf-8") as f:
                js = f.read()
            parts.append(f"<!-- ===== Lektion {i} ===== -->\n<script>\n{js}\n</script>")
            found.append(i)
        else:
            parts.append(f"<!-- Lektion {i}: build/lektion{i}.js fehlt noch -->")

    injection = "\n".join(parts)
    out = tpl.replace(placeholder, injection)

    out_path = os.path.join(ROOT, "index.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(out)

    size = os.path.getsize(out_path)
    print(f"Wrote index.html ({size/1024:.1f} KB). Lessons included: {found if found else 'NONE (shell only)'}")

if __name__ == "__main__":
    main()
