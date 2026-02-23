from fastmcp import FastMCP
from tools.say_hello import say_hello

mcp = FastMCP("Dynamic MCP 🚀")

# Register tool to this MCP instance
mcp.tool()(say_hello)

if __name__ == "__main__":
    mcp.run()