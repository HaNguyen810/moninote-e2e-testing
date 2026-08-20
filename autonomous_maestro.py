import os
import subprocess
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate

# Base directory points to the root 'automation' folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

llm = ChatOllama(
    model="qwen2.5-coder:7b",
    temperature=0.1,
    base_url="http://localhost:11434"
)

PROMPT_TEMPLATE = """
You are an AI Test Automation Engineer specializing in Maestro.dev.
A Maestro test failed during execution.

=== BROKEN MAESTRO YAML ===
{yaml_content}

=== MAESTRO ERROR LOG / UI HIERARCHY ===
{error_log}

=== INSTRUCTIONS ===
1. Analyze the failure reason (e.g., missing selector, timeout, text mismatch).
2. Fix the YAML code to make the test resilient.
3. Return ONLY valid YAML code inside a ```yaml block or plain code. Do not include extra conversational text.
"""

def run_maestro_suite(flow_path):
    print(f"🚀 Running Maestro Flow: {flow_path}")
    result = subprocess.run(
        ["maestro", "test", flow_path],
        capture_output=True,
        text=True
    )
    return result.returncode == 0, result.stdout + "\n" + result.stderr

def self_heal_script(yaml_path, error_log):
    if not os.path.exists(yaml_path):
        print(f"❌ Error: Cannot self-heal because target file does not exist at {yaml_path}")
        return

    print(f"🛠️ Self-healing {yaml_path} using local Ollama...")
    with open(yaml_path, "r", encoding="utf-8") as f:
        yaml_content = f.read()

    prompt = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
    chain = prompt | llm
    response = chain.invoke({"yaml_content": yaml_content, "error_log": error_log})
    
    fixed_yaml = response.content.replace("```yaml", "").replace("```", "").strip()
    
    with open(yaml_path, "w", encoding="utf-8") as f:
        f.write(fixed_yaml)
    print(f"✅ Updated {yaml_path} with AI patch.")

def agent_loop(flow_path, max_retries=3):
    if not os.path.exists(flow_path):
        print(f"🚨 Target file not found: {flow_path}")
        print("Please check the path or verify your folder structure.")
        return False

    for attempt in range(1, max_retries + 1):
        success, logs = run_maestro_suite(flow_path)
        if success:
            print(f"🎉 Test {flow_path} passed on attempt {attempt}!")
            return True
        
        print(f"❌ Test failed on attempt {attempt}/{max_retries}.")
        if attempt < max_retries:
            self_heal_script(flow_path, logs)
            
    print(f"🚨 Test {flow_path} could not be automatically healed.")
    return False

if __name__ == "__main__":
    # Choose target flow based on your repo layout:
    
    # 1. Android launch test:
    target_flow = os.path.join(BASE_DIR, "maestro", "android", "flows", "launch-app.yaml")
    
    # 2. Web sign-in test (Uncomment to use):
    # target_flow = os.path.join(BASE_DIR, "maestro", "web", "flows", "sign-in.yaml")

    agent_loop(target_flow)