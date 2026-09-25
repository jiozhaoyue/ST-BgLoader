# Trellis Shell Discipline (pre-shell hook)

> Working discipline for THIS repo's tooling. Added 2026-09-25 after hitting the failure
> twice in one day during the full-audit task.

---

## The trap

The host resolves the pre-shell hook (`inject-shell-session-context.py`) as a **relative
path from the shell tool's current working directory**. The shell tool's cwd **persists
between Bash calls**. If any Bash command ends with a different cwd than it started with
(e.g. `cd .trellis/tasks/<task> && ...`), every subsequent Bash call fails before the
command even runs:

```
python: can't open file 'D:\...\<subdir>/.zcode/hooks/inject-shell-session-context.py':
[Errno 2] No such file or directory
```

The failure is total: `pwd`, `cd`, anything — the hook runs first and its resolution
error replaces the command output. Only file tools (Read/Write/Edit) still work, because
they do not go through the shell hook.

## Recovery (while stranded)

1. Write a shim at the path the error names (the stranded cwd), forwarding to the real
   hook — file tools can do this while Bash is blocked:

   ```python
   import runpy, os, sys
   _ROOT = <absolute repo root>
   _real = os.path.join(_ROOT, ".zcode", "hooks", "inject-shell-session-context.py")
   sys.argv[0] = _real
   runpy.run_path(_real, run_name="__main__")
   ```

2. First successful Bash call: `cd <absolute repo root> && pwd && rm -rf <subdir>/.zcode`
   — restore the cwd, then delete the shim (the root hook resolves normally again).

## Prevention (the rule)

- **Bash commands must NOT change the working directory to a subdirectory.** Use
  absolute paths inside the command instead of `cd && ...`:
  - `cat .trellis/tasks/<task>/prd.md` — fine without cd;
  - `python ./.trellis/scripts/task.py start <task>` — run from repo root, no cd;
  - multi-command pipelines: `git -C <abs-path> ...`, `ls <abs-path>`, etc.
- If a `cd` is truly unavoidable, end the command with `cd <repo-root>` so the persisted
  cwd is always the repo root.
- After any command that could have moved the cwd, a quick `pwd` check costs nothing.
