# fastmcp/tool_loader/loader.py

import os
import yaml
from registry import registry


TYPE_MAP = {
    "integer": "int",
    "string": "str",
    "number": "float",
    "boolean": "bool"
}


def load_yaml_tools():
    tools_dir = os.path.join(os.path.dirname(__file__), "..", "tools", "yaml")

    for file in os.listdir(tools_dir):
        if file.endswith(".yaml"):
            path = os.path.join(tools_dir, file)

            with open(path, "r") as f:
                config = yaml.safe_load(f)

            register_tool(config)


def register_tool(config):
    name = config["name"]
    description = config.get("description", "")
    properties = config["inputSchema"]["properties"]
    expression = config["operation"]["expression"]

    params = []
    for field, field_info in properties.items():
        py_type = TYPE_MAP.get(field_info["type"], "str")
        params.append(f"{field}: {py_type}")

    param_str = ", ".join(params)

    function_code = f"""
def {name}({param_str}):
    \"\"\"{description}\"\"\"
    return {expression}
"""

    local_scope = {}
    exec(function_code, {}, local_scope)

    dynamic_function = local_scope[name]

    # Register in global registry
    registry.register(name, dynamic_function)