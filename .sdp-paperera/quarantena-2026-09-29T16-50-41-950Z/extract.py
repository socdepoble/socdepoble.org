import re
import os

files = [
    "src/sections/disseny/cataleg/PaginaEstructura.jsx",
    "src/sections/disseny/cataleg/PaginaFormularis.jsx",
    "src/sections/disseny/cataleg/PaginaNavegacio.jsx",
    "src/sections/disseny/cataleg/PaginaRetroalimentacio.jsx",
    "src/sections/disseny/cataleg/PaginaSuperposicions.jsx"
]

out_dir = "src/sections/disseny/cataleg/detalls/"

def to_camel_case(snake_str):
    components = re.split(r'[-_]', snake_str)
    return components[0].title() + ''.join(x.title() for x in components[1:])

manifest_entries = []

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()

    imports = []
    for line in content.split('\n'):
        if line.startswith('import') and 'Especimen' not in line:
            # Fix relative paths from Pagina to detalls/
            if '../' in line:
                line = line.replace('../', '../../')
            imports.append(line)

    especimens = re.findall(r'<Especimen\s+id="([^"]+)"(.*?)>(.*?)</Especimen>', content, re.DOTALL)
    for eid, attrs, inner in especimens:
        # Create a valid React component name
        comp_name = "Especimen" + to_camel_case(eid)
        
        # We need to reconstruct the <Especimen> tag
        code = f"""import {{ Especimen }} from '../Especimen.jsx';
{chr(10).join(imports)}

export default function {comp_name}() {{
  return (
    <Especimen id="{eid}"{attrs}>
      {inner.strip()}
    </Especimen>
  );
}}
"""
        out_path = os.path.join(out_dir, f"{comp_name}.jsx")
        with open(out_path, 'w') as out_f:
            out_f.write(code)
            
        manifest_entries.append({
            'id': eid,
            'comp': comp_name,
            'source': filepath
        })
        print(f"Created {comp_name}.jsx")

for entry in manifest_entries:
    print(entry)
