from pathlib import Path
import importlib.util
import logging
import sys


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


app_package = _load_app_package()
app = app_package.create_app()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    for rule in app.url_map.iter_rules():
        logging.info(f"Route: {rule} -> methods={','.join(sorted(rule.methods))}")

    app.run(debug=True, port=5000)