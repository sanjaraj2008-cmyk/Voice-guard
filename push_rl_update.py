"""
push_rl_update.py — Push RL fine-tuning results to GitHub via REST API
"""
import sys, os, json, base64, urllib.request, urllib.error

def get_token():
    if len(sys.argv) > 1 and sys.argv[1].startswith("ghp_"):
        return sys.argv[1]
    if os.environ.get("GITHUB_TOKEN"):
        return os.environ.get("GITHUB_TOKEN")
    token_file = os.path.join(os.path.dirname(__file__), ".git", "token")
    if os.path.exists(token_file):
        with open(token_file, "r") as f:
            return f.read().strip()
    return ""

TOKEN  = get_token()
OWNER  = "sanjaraj2008-cmyk"
REPO   = "Voice-guard"
BRANCH = "main"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "DocuGuard-RL-Pusher"
}

def gh(url, data=None, method="GET"):
    req = urllib.request.Request(url, headers=HEADERS, method=method)
    if data:
        req.data = json.dumps(data).encode()
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()[:400]}")
        raise

def blob_text(path):
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()
    r = gh(f"https://api.github.com/repos/{OWNER}/{REPO}/git/blobs",
           data={"content": content, "encoding": "utf-8"}, method="POST")
    return r["sha"]

def blob_binary(path):
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    r = gh(f"https://api.github.com/repos/{OWNER}/{REPO}/git/blobs",
           data={"content": b64, "encoding": "base64"}, method="POST")
    return r["sha"]

def main():
    # --- get base ---
    ref     = gh(f"https://api.github.com/repos/{OWNER}/{REPO}/git/refs/heads/{BRANCH}")
    latest  = ref["object"]["sha"]
    base_tree = gh(f"https://api.github.com/repos/{OWNER}/{REPO}/git/commits/{latest}")["tree"]["sha"]
    print(f"Base commit : {latest[:7]}")
    print(f"Base tree   : {base_tree[:7]}")

    tree_elements = []

    # text files
    TEXT = [
        "rl_finetune.py",
        "push_rl_update.py",
        "public/ai-model/model.json",
        "public/ai-model/model_metadata.json",
        "train_torch.py",
    ]
    for p in TEXT:
        if not os.path.exists(p):
            print(f"SKIP (missing): {p}")
            continue
        sha = blob_text(p)
        print(f"  [text]   {p} -> {sha[:7]}")
        tree_elements.append({"path": p.replace("\\","/"), "mode":"100644","type":"blob","sha": sha})

    # binary files
    BINARY = [
        "public/ai-model/group1-shard1of1.bin",
        "trained_model/docuguard_best_pytorch.pt",
        "trained_model/docuguard_rl_finetuned.pt",
    ]
    for p in BINARY:
        if not os.path.exists(p):
            print(f"SKIP (missing): {p}")
            continue
        mb = os.path.getsize(p)/1048576
        print(f"  [binary] {p} ({mb:.1f} MB) ...")
        sha = blob_binary(p)
        print(f"           -> {sha[:7]}")
        tree_elements.append({"path": p.replace("\\","/"), "mode":"100644","type":"blob","sha": sha})

    # --- create tree ---
    new_tree = gh(f"https://api.github.com/repos/{OWNER}/{REPO}/git/trees",
                  data={"base_tree": base_tree, "tree": tree_elements}, method="POST")
    print(f"New tree    : {new_tree['sha'][:7]}")

    # --- create commit ---
    msg = (
        "feat: RL fine-tuning (REINFORCE) + fix 95% score collapse\n\n"
        "- rl_finetune.py: REINFORCE policy gradient, entropy bonus,\n"
        "  calibrated score head, frozen early backbone\n"
        "- Fixes hardcoded 5/55/95 targets that caused model to always\n"
        "  output 95% credit regardless of input\n"
        "- Best Val Acc: 65.80% | Score now varies per class\n"
        "- Updated TF.js weights (model.json + .bin shard)\n"
        "- push_rl_update.py: GitHub REST API push helper"
    )
    commit = gh(f"https://api.github.com/repos/{OWNER}/{REPO}/git/commits",
                data={"message": msg, "tree": new_tree["sha"], "parents": [latest]}, method="POST")
    print(f"New commit  : {commit['sha'][:7]}")

    # --- update ref ---
    gh(f"https://api.github.com/repos/{OWNER}/{REPO}/git/refs/heads/{BRANCH}",
       data={"sha": commit["sha"], "force": True}, method="PATCH")

    print(f"\n[SUCCESS] https://github.com/{OWNER}/{REPO}/commit/{commit['sha'][:7]}")

if __name__ == "__main__":
    main()
