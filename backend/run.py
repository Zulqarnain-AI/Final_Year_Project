from pathlib import Path
import importlib.util
import logging
import os
import sys


def _parse_env_line(line):
    stripped = line.strip()
    if not stripped or stripped.startswith("#") or "=" not in stripped:
        return None, None

    key, value = stripped.split("=", 1)
    key = key.strip()
    value = value.strip()

    if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
        value = value[1:-1]

    return key, value


def _load_env_files(base_dir):
    for filename in [".env", ".evn"]:
        env_path = base_dir / filename
        if not env_path.exists():
            continue

        for line in env_path.read_text(encoding="utf-8").splitlines():
            key, value = _parse_env_line(line)
            if key and value is not None and key not in os.environ:
                os.environ[key] = value


def _load_app_package():
    package_dir = Path(__file__).resolve().parent / "app"
    spec = importlib.util.spec_from_file_location(
        "app",
        package_dir / "__init__.py",
        submodule_search_locations=[str(package_dir)],
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load app package")

    module = importlib.util.module_from_spec(spec)
    sys.modules["app"] = module
    spec.loader.exec_module(module)
    return module


_load_env_files(Path(__file__).resolve().parent)
app_package = _load_app_package()
app = app_package.create_app()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    for rule in app.url_map.iter_rules():
        logging.info(f"Route: {rule} -> methods={','.join(sorted(rule.methods))}")

    app.run(debug=True, port=5000)