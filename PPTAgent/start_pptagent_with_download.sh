#!/bin/bash
# cd /root/AI-teaching-platform/PPTAgent && ./start_pptagent_with_download.sh --proxy --proxy-host 172.19.128.1 --proxy-port 4780
# Default values
PORT=8000
FILE_PORT=8001
HOSTNAME="0.0.0.0"
TRANSPORT="streamable-http"
CORS=false
DEBUG=false
SKIP_ENV_CHECK=false
OFFLINE_MODE=false
USE_PROXY=false
PROXY_HOST="localhost"
PROXY_PORT="4780"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -p|--port)
      PORT="$2"
      shift 2
      ;;
    -fp|--file-port)
      FILE_PORT="$2"
      shift 2
      ;;
    -h|--hostname)
      HOSTNAME="$2"
      shift 2
      ;;
    -t|--transport)
      TRANSPORT="$2"
      shift 2
      ;;
    -c|--cors)
      CORS=true
      shift
      ;;
    -d|--debug)
      DEBUG=true
      shift
      ;;
    -s|--skip-env-check)
      SKIP_ENV_CHECK=true
      shift
      ;;
    -o|--offline)
      OFFLINE_MODE=true
      shift
      ;;
    --proxy)
      USE_PROXY=true
      shift
      ;;
    --proxy-host)
      PROXY_HOST="$2"
      shift 2
      ;;
    --proxy-port)
      PROXY_PORT="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate transport value
if [[ "$TRANSPORT" != "streamable-http" && "$TRANSPORT" != "sse" ]]; then
  echo "Error: Transport must be either 'streamable-http' or 'sse'"
  exit 1
fi

# Check and set conda environment
if [ "$SKIP_ENV_CHECK" = false ]; then
  echo -e "\033[36mChecking conda environment...\033[0m"
  
  CONDA_PREFIX=$CONDA_PREFIX
  CONDA_DEFAULT_ENV=$CONDA_DEFAULT_ENV
  
  # Check if conda is available
  if ! command -v conda &> /dev/null; then
    echo -e "\033[31mWarning: conda command not found. Please ensure conda is installed and in PATH.\033[0m"
    exit 1
  fi
  
  # Get list of all environments
  ENV_LIST=$(conda env list 2>&1)
  echo -e "\033[36mAvailable conda environments:\033[0m"
  echo "$ENV_LIST"
  
  # Check if pptagent environment exists
  if echo "$ENV_LIST" | grep -q "pptagent"; then
    echo -e "\033[32mpptagent environment found\033[0m"
    
    # Check if we're already in pptagent environment
    if [ "$CONDA_DEFAULT_ENV" = "pptagent" ]; then
      echo -e "\033[32mAlready in pptagent conda environment\033[0m"
    else
      echo -e "\033[33mActivating pptagent conda environment...\033[0m"
      
      # Try to activate the environment
      if source "$(conda info --base)/etc/profile.d/conda.sh" && conda activate pptagent; then
        # Verify activation
        CONDA_DEFAULT_ENV=$CONDA_DEFAULT_ENV
        if [ "$CONDA_DEFAULT_ENV" = "pptagent" ]; then
          echo -e "\033[32mSuccessfully activated pptagent conda environment\033[0m"
        else
          echo -e "\033[33mWarning: Failed to activate pptagent environment. Current environment: $CONDA_DEFAULT_ENV\033[0m"
          echo -e "\033[33mPlease manually run: conda activate pptagent\033[0m"
        fi
      else
        echo -e "\033[31mError activating conda environment\033[0m"
        echo -e "\033[33mPlease manually run: conda activate pptagent\033[0m"
      fi
    fi
  else
    echo -e "\033[31mError: pptagent conda environment not found. Please create it first.\033[0m"
    echo -e "\033[33mRun: conda create -n pptagent python=3.10\033[0m"
    exit 1
  fi
fi

# Ensure PPTAgent is in Python path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo -e "\033[36mScript directory: $SCRIPT_DIR\033[0m"

# Add script directory to Python path
if [ -n "$PYTHONPATH" ]; then
  export PYTHONPATH="$SCRIPT_DIR:$PYTHONPATH"
else
  export PYTHONPATH="$SCRIPT_DIR"
fi
echo -e "\033[32mAdded script directory to Python path: $SCRIPT_DIR\033[0m"

# If we're in PPTAgent directory, also add parent directory
if [ "$(basename "$SCRIPT_DIR")" = "PPTAgent" ]; then
  PARENT_DIR="$(dirname "$SCRIPT_DIR")"
  export PYTHONPATH="$PARENT_DIR:$PYTHONPATH"
  echo -e "\033[32mAdded parent directory to Python path: $PARENT_DIR\033[0m"
fi

# Check if pptagent module exists
PPTAGENT_PATH="$SCRIPT_DIR/pptagent"
if [ ! -d "$PPTAGENT_PATH" ]; then
  echo -e "\033[33mWarning: pptagent module not found in $SCRIPT_DIR\033[0m"
  # Try to find it in parent directories
  CURRENT_DIR="$SCRIPT_DIR"
  while [ "$CURRENT_DIR" != "$(dirname "$CURRENT_DIR")" ]; do
    TEST_PATH="$CURRENT_DIR/pptagent"
    if [ -d "$TEST_PATH" ]; then
      export PYTHONPATH="$CURRENT_DIR:$PYTHONPATH"
      echo -e "\033[32mFound pptagent module in $CURRENT_DIR, added to Python path\033[0m"
      break
    fi
    CURRENT_DIR="$(dirname "$CURRENT_DIR")"
  done
else
  echo -e "\033[32mpptagent module found in $PPTAGENT_PATH\033[0m"
fi

# Set environment variables directly
export PPTAGENT_MODEL="Kimi-K2-0905"
export PPTAGENT_API_BASE="https://www.sophnet.com/api/open-apis/v1"
export PPTAGENT_API_KEY="iBnIH0NaZ1WDH6PAdqNIyi8EUEj9tv7wLgoyIV2PW6lIPPGMQ2DLLztXKiMICHRHfd8gvnSOx5jhwi_-jq30Wg"

# Set proxy if specified
if [ "$USE_PROXY" = true ]; then
  export HTTP_PROXY="http://$PROXY_HOST:$PROXY_PORT"
  export HTTPS_PROXY="http://$PROXY_HOST:$PROXY_PORT"
  export HF_HUB_HTTP_PROXY="http://$PROXY_HOST:$PROXY_PORT"
  export HF_HUB_HTTPS_PROXY="http://$PROXY_HOST:$PROXY_PORT"
  echo -e "\033[32mProxy settings:\033[0m"
  echo -e "\033[37m  HTTP_PROXY: $HTTP_PROXY\033[0m"
  echo -e "\033[37m  HTTPS_PROXY: $HTTPS_PROXY\033[0m"
  echo -e "\033[37m  HF_HUB_HTTP_PROXY: $HF_HUB_HTTP_PROXY\033[0m"
  echo -e "\033[37m  HF_HUB_HTTPS_PROXY: $HF_HUB_HTTPS_PROXY\033[0m"
fi

echo -e "\033[32mEnvironment variables set:\033[0m"
echo -e "\033[37m  PPTAGENT_MODEL: $PPTAGENT_MODEL\033[0m"
echo -e "\033[37m  PPTAGENT_API_BASE: $PPTAGENT_API_BASE\033[0m"
echo -e "\033[37m  PPTAGENT_API_KEY: $PPTAGENT_API_KEY\033[0m"

# Check SOFFICE path
SOFFICE_PATH=$SOFFICE_PATH
if [ -z "$SOFFICE_PATH" ]; then
  echo -e "\033[33mWarning: SOFFICE_PATH environment variable is not set, will use default path\033[0m"
elif [ ! -f "$SOFFICE_PATH" ]; then
  echo -e "\033[33mWarning: SOFFICE path does not exist: $SOFFICE_PATH\033[0m"
fi

# Prepare debug code
if [ "$DEBUG" = true ]; then
  DEBUG_CODE="    transport_kwargs['debug'] = True"
else
  DEBUG_CODE=""
fi

# Create temporary Python script
TEMP_FILE="/tmp/pptagent_server_with_download_$$.py"

# Build Python code for starting both MCP server and file download server
cat > "$TEMP_FILE" << EOF
import threading
import time
from pptagent.mcp_server import PPTAgentServer
from pptagent.file_server import FileDownloadServer
import os

# Set offline mode if specified
offline_mode = $([ "$OFFLINE_MODE" = true ] && echo "True" || echo "False")
if offline_mode:
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    print("Running in offline mode - model downloads will be skipped")

# Set proxy if specified
use_proxy = $([ "$USE_PROXY" = true ] && echo "True" || echo "False")
if use_proxy:
    proxy_host = "$PROXY_HOST"
    proxy_port = "$PROXY_PORT"
    os.environ["HTTP_PROXY"] = f"http://{proxy_host}:{proxy_port}"
    os.environ["HTTPS_PROXY"] = f"http://{proxy_host}:{proxy_port}"
    print(f"Using proxy: {proxy_host}:{proxy_port}")

print(f"Starting PPTAgent MCP HTTP Server and File Download Server...")
print(f"Transport mode: $TRANSPORT")
print(f"MCP Server Listen address: $HOSTNAME:$PORT")
print(f"File Server Listen address: $HOSTNAME:$FILE_PORT")
print(f"Model: {os.getenv('PPTAGENT_MODEL')}")
print(f"API Base: {os.getenv('PPTAGENT_API_BASE')}")

soffice_path = os.getenv('SOFFICE_PATH')
if soffice_path:
    print(f"LibreOffice path: {soffice_path}")

# Create MCP server instance
mcp_server = PPTAgentServer()
mcp_server.register_tools()

# Create file download server instance
file_server = FileDownloadServer(mcp_server, host='$HOSTNAME', port=$FILE_PORT)

# Function to run MCP server
def run_mcp_server():
    # Configure transport parameters
    transport_kwargs = {
        'host': '$HOSTNAME',
        'port': $PORT
    }
    
    # Add debug if needed
    $DEBUG_CODE

    # Start MCP server
    print(f"Starting MCP server on $HOSTNAME:$PORT")
    mcp_server.mcp.run(transport='$TRANSPORT', show_banner=True, **transport_kwargs)

# Function to run file server
def run_file_server():
    print(f"Starting file download server on $HOSTNAME:$FILE_PORT")
    file_server.run()

# Start file server in a separate thread
file_server_thread = threading.Thread(target=run_file_server)
file_server_thread.daemon = True
file_server_thread.start()

# Give file server time to start
time.sleep(2)

# Start MCP server in the main thread
run_mcp_server()
EOF

# Start Python server
echo -e "\033[32mStarting PPTAgent MCP HTTP Server and File Download Server...\033[0m"
echo -e "\033[37mTransport mode: $TRANSPORT\033[0m"
echo -e "\033[37mMCP Server Listen address: $HOSTNAME:$PORT\033[0m"
echo -e "\033[37mFile Server Listen address: $HOSTNAME:$FILE_PORT\033[0m"
echo -e "\033[37mModel: $PPTAGENT_MODEL\033[0m"
echo -e "\033[37mAPI Base: $PPTAGENT_API_BASE\033[0m"
if [ -n "$SOFFICE_PATH" ]; then
  echo -e "\033[37mLibreOffice path: $SOFFICE_PATH\033[0m"
fi

# Display the content of the temp file for debugging
echo -e "\033[33mContent of temporary file:\033[0m"
cat "$TEMP_FILE" | while read line; do
  echo -e "\033[90m$line\033[0m"
done
echo -e "\033[33mEnd of temporary file content\033[0m"

# Start Python process
python "$TEMP_FILE"
PYTHON_EXIT_CODE=$?

# Clean up temporary file
rm -f "$TEMP_FILE"

if [ $PYTHON_EXIT_CODE -ne 0 ]; then
  echo -e "\033[31mError: Failed to start servers, exit code: $PYTHON_EXIT_CODE\033[0m"
  exit 1
fi