param(
    [int]$Port = 8000,
    [int]$FilePort = 8001,
    [string]$Hostname = "0.0.0.0",
    [ValidateSet("streamable-http", "sse")]
    [string]$Transport = "streamable-http",
    [switch]$Cors,
    [switch]$Debug,
    [switch]$SkipEnvCheck
)

# Check and set conda environment
if (-not $SkipEnvCheck) {
    Write-Host "Checking conda environment..." -ForegroundColor Cyan
    
    $condaPrefix = $env:CONDA_PREFIX
    $condaDefaultEnv = $env:CONDA_DEFAULT_ENV
    
    # Check if conda is available
    try {
        $condaResult = conda --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Warning: conda command not found. Please ensure conda is installed and in PATH." -ForegroundColor Red
            exit 1
        }
        
        # Get list of all environments
        $envList = conda env list 2>&1
        Write-Host "Available conda environments:" -ForegroundColor Cyan
        Write-Host $envList
        
        # Check if pptagent environment exists
        if ($envList -match "pptagent") {
            Write-Host "pptagent environment found" -ForegroundColor Green
            
            # Check if we're already in pptagent environment
            if ($condaDefaultEnv -eq "pptagent") {
                Write-Host "Already in pptagent conda environment" -ForegroundColor Green
            } else {
                Write-Host "Activating pptagent conda environment..." -ForegroundColor Yellow
                
                # Try to activate the environment
                try {
                    # Use conda activate command
                    $activateCmd = "conda activate pptagent"
                    Write-Host "Running: $activateCmd" -ForegroundColor Yellow
                    
                    # Execute conda activate in the current session
                    Invoke-Expression $activateCmd
                    
                    # Verify activation
                    $condaDefaultEnv = $env:CONDA_DEFAULT_ENV
                    if ($condaDefaultEnv -eq "pptagent") {
                        Write-Host "Successfully activated pptagent conda environment" -ForegroundColor Green
                    } else {
                        Write-Host "Warning: Failed to activate pptagent environment. Current environment: $condaDefaultEnv" -ForegroundColor Yellow
                        Write-Host "Please manually run: conda activate pptagent" -ForegroundColor Yellow
                    }
                }
                catch {
                    Write-Host "Error activating conda environment: $_" -ForegroundColor Red
                    Write-Host "Please manually run: conda activate pptagent" -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "Error: pptagent conda environment not found. Please create it first." -ForegroundColor Red
            Write-Host "Run: conda create -n pptagent python=3.10" -ForegroundColor Yellow
            exit 1
        }
    }
    catch {
        Write-Host "Error checking conda environment: $_" -ForegroundColor Red
        exit 1
    }
}

# Ensure PPTAgent is in Python path
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Host "Script directory: $scriptDir" -ForegroundColor Cyan

# Add script directory to Python path
if ($env:PYTHONPATH) {
    $env:PYTHONPATH = "$scriptDir;$env:PYTHONPATH"
} else {
    $env:PYTHONPATH = $scriptDir
}
Write-Host "Added script directory to Python path: $scriptDir" -ForegroundColor Green

# If we're in PPTAgent directory, also add parent directory
if ((Split-Path -Leaf $scriptDir) -eq "PPTAgent") {
    $parentDir = Split-Path -Parent $scriptDir
    $env:PYTHONPATH = "$parentDir;$env:PYTHONPATH"
    Write-Host "Added parent directory to Python path: $parentDir" -ForegroundColor Green
}

# Check if pptagent module exists
$pptagentPath = Join-Path $scriptDir "pptagent"
if (-not (Test-Path $pptagentPath)) {
    Write-Host "Warning: pptagent module not found in $scriptDir" -ForegroundColor Yellow
    # Try to find it in parent directories
    $currentDir = $scriptDir
    while ($currentDir -and $currentDir -ne (Split-Path -Parent $currentDir)) {
        $testPath = Join-Path $currentDir "pptagent"
        if (Test-Path $testPath) {
            $env:PYTHONPATH = "$currentDir;$env:PYTHONPATH"
            Write-Host "Found pptagent module in $currentDir, added to Python path" -ForegroundColor Green
            break
        }
        $currentDir = Split-Path -Parent $currentDir
    }
} else {
    Write-Host "pptagent module found in $pptagentPath" -ForegroundColor Green
}

# Set environment variables directly
$env:PPTAGENT_MODEL = "Kimi-K2-0905"
$env:PPTAGENT_API_BASE = "https://www.sophnet.com/api/open-apis/v1"
$env:PPTAGENT_API_KEY = "iBnIH0NaZ1WDH6PAdqNIyi8EUEj9tv7wLgoyIV2PW6lIPPGMQ2DLLztXKiMICHRHfd8gvnSOx5jhwi_-jq30Wg"

Write-Host "Environment variables set:" -ForegroundColor Green
Write-Host "  PPTAGENT_MODEL: $($env:PPTAGENT_MODEL)" -ForegroundColor White
Write-Host "  PPTAGENT_API_BASE: $($env:PPTAGENT_API_BASE)" -ForegroundColor White
Write-Host "  PPTAGENT_API_KEY: $($env:PPTAGENT_API_KEY)" -ForegroundColor White

# Check SOFFICE path
$sofficePath = $env:SOFFICE_PATH
if (-not $sofficePath) {
    Write-Host "Warning: SOFFICE_PATH environment variable is not set, will use default path" -ForegroundColor Yellow
}
elseif (-not (Test-Path $sofficePath)) {
    Write-Host "Warning: SOFFICE path does not exist: $sofficePath" -ForegroundColor Yellow
}

# Prepare debug code
if ($Debug) {
    $debugCode = "    transport_kwargs['debug'] = True"
} else {
    $debugCode = ""
}

# Build Python code for starting both MCP server and file download server
$pythonCode = @"
import threading
import time
from pptagent.mcp_server import PPTAgentServer
from pptagent.file_server import FileDownloadServer
import os

print(f"Starting PPTAgent MCP HTTP Server and File Download Server...")
print(f"Transport mode: $Transport")
print(f"MCP Server Listen address: $Hostname`:$Port")
print(f"File Server Listen address: $Hostname`:$FilePort")
print(f"Model: {os.getenv('PPTAGENT_MODEL')}")
print(f"API Base: {os.getenv('PPTAGENT_API_BASE')}")

soffice_path = os.getenv('SOFFICE_PATH')
if soffice_path:
    print(f"LibreOffice path: {soffice_path}")

# Create MCP server instance
mcp_server = PPTAgentServer()
mcp_server.register_tools()

# Create file download server instance
file_server = FileDownloadServer(mcp_server, host='$Hostname', port=$FilePort)

# Function to run MCP server
def run_mcp_server():
    # Configure transport parameters
    transport_kwargs = {
        'host': '$Hostname',
        'port': $Port
    }
    
    # Add debug if needed
    $debugCode

    # Start MCP server
    print(f"Starting MCP server on $Hostname`:$Port")
    mcp_server.mcp.run(transport='$Transport', show_banner=True, **transport_kwargs)

# Function to run file server
def run_file_server():
    print(f"Starting file download server on $Hostname`:$FilePort")
    file_server.run()

# Start file server in a separate thread
file_server_thread = threading.Thread(target=run_file_server)
file_server_thread.daemon = True
file_server_thread.start()

# Give file server time to start
time.sleep(2)

# Start MCP server in the main thread
run_mcp_server()
"@

# Start Python server
try {
    Write-Host "Starting PPTAgent MCP HTTP Server and File Download Server..." -ForegroundColor Green
    Write-Host "Transport mode: $Transport" -ForegroundColor White
    Write-Host "MCP Server Listen address: $Hostname`:$Port" -ForegroundColor White
    Write-Host "File Server Listen address: $Hostname`:$FilePort" -ForegroundColor White
    Write-Host "Model: $($env:PPTAGENT_MODEL)" -ForegroundColor White
    Write-Host "API Base: $($env:PPTAGENT_API_BASE)" -ForegroundColor White
    if ($sofficePath) {
        Write-Host "LibreOffice path: $sofficePath" -ForegroundColor White
    }
    
    # Write Python code to a temporary file
    $tempFile = Join-Path $env:TEMP "pptagent_server_with_download_$PID.py"
    $pythonCode | Out-File -FilePath $tempFile -Encoding utf8
    
    # Display the content of the temp file for debugging
    Write-Host "Content of temporary file:" -ForegroundColor Yellow
    Get-Content -Path $tempFile | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
    Write-Host "End of temporary file content" -ForegroundColor Yellow
    
    # Start Python process
    $pythonProcess = Start-Process python -ArgumentList $tempFile -NoNewWindow -Wait -PassThru
    
    # Clean up temporary file
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    
    if ($pythonProcess.ExitCode -ne 0) {
        Write-Host "Error: Failed to start servers, exit code: $($pythonProcess.ExitCode)" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "Error: Failed to start servers: $_" -ForegroundColor Red
    exit 1
}