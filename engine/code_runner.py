import sys
import subprocess
import time
import tempfile
import os

def run_python_code(code_str, stdin_input="", timeout_sec=5):
    """
    Safely executes arbitrary Python code in a subprocess with optional stdin input.
    Returns: { "success": bool, "output": str, "error": str, "execution_time_ms": float }
    """
    start_time = time.time()
    
    # Create temporary .py file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
        f.write(code_str)
        temp_file_path = f.name

    try:
        # Run using current python interpreter with strict UTF-8 support
        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"
        env["PYTHONUTF8"] = "1"

        process = subprocess.run(
            [sys.executable, "-X", "utf8", temp_file_path],
            input=stdin_input if stdin_input else None,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            env=env,
            timeout=timeout_sec
        )

        exec_time = round((time.time() - start_time) * 1000, 2)
        output = process.stdout
        error = process.stderr

        if process.returncode == 0:
            return {
                "success": True,
                "output": output if output else "Program executed successfully with no output.",
                "error": None,
                "execution_time_ms": exec_time
            }
        else:
            return {
                "success": False,
                "output": output,
                "error": error if error else "Execution exited with an error.",
                "execution_time_ms": exec_time
            }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "output": "",
            "error": f"⏰ Time Limit Exceeded! Your code ran for longer than {timeout_sec} seconds (possible infinite loop or waiting for input).",
            "execution_time_ms": timeout_sec * 1000
        }
    except Exception as e:
        return {
            "success": False,
            "output": "",
            "error": f"Internal execution error: {str(e)}",
            "execution_time_ms": 0
        }
    finally:
        # Cleanup temp file
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass

if __name__ == "__main__":
    # Test stdin input simulation
    test_code = """
name = input("Enter student name: ")
print(f"Welcome {name} to Python Sikho!")
"""
    res = run_python_code(test_code, stdin_input="Virendra\n")
    print(res)
