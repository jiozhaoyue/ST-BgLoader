# Repo Integrity Discipline (against external snapshot/restore tools)

> Added 2026-09-26 after an incident in which this repository was silently rewound to a
> 2026-09-06 state mid-session. All uncommitted work was lost.

---

## What happened (the trap)

Mid-session, this working tree changed underneath the running agent:

| Observation | Before | After |
| --- | --- | --- |
| `HEAD` / `master` | the session's 9th commit | a commit from **20 days earlier** |
| Tracked source files | session's edits | the old commit's content |
| `dist/` | fresh build (~176 kB) | old build (~129 kB) |
| `src/backend/` | tracked | became **untracked** (files intact, session content) |

**The decisive diagnostic:** `.git/logs/HEAD` and `.git/logs/refs/heads/master` still ended at
the session's own commit, with **no entry for the move** — while `.git/refs/heads/master` and
`.git/refs/remotes/origin/` had both been **written directly** (file mtimes matched the
incident window).

→ **No `git` command can move a ref without writing a reflog entry.** A ref file that changed
with no reflog entry means something wrote it as a *file*, bypassing git.

**Why some files survived:** the rewind only clobbered paths that already existed in the old
commit. Paths that did not exist back then (`src/backend/`, newer task directories) were left
alone and kept their session content. That asymmetry is the fingerprint of a
snapshot/directory-restore, not of git.

## Rules

1. **Never write `.git/refs/*`, `.git/HEAD`, `.git/packed-refs`, or `.git/logs/*` directly.**
   Any sync, backup, or restore tool must move refs through git
   (`git update-ref`, `git reset`, `git fetch`, `git push`) so a reflog entry is recorded and
   the change is traceable and revertible.
2. **Prefer ref updates to file copying.** A tool that restores files should restore the
   *worktree* and let git derive the rest — or better, restore from a commit/tag, never from a
   raw directory snapshot that includes `.git/`.
3. **If a snapshot must include `.git/`, exclude the volatile ref stores** (`refs/`,
   `logs/`, `HEAD`, `ORIG_HEAD`, `index`). Restoring those is how history gets silently lost.

## Commit discipline (the other half of the lesson)

The loss was **total for everything uncommitted**. Long-lived uncommitted trees are
single-point-of-failure: they are not in the object store, not in the reflog, not on the remote,
and no recovery tool can bring them back.

- **Commit at each coherent step, not at the end of a batch.** Push to the remote as you go.
- When reviewing a sub-agent's work, commit it as soon as it lands — do not let it sit while the
  next batch runs.
- Untracked files are **not** protected either. If a scratch artifact matters, commit it or copy
  it outside the repository.

## If it happens again (recovery procedure)

1. **Do not run any `checkout` / `reset` / `clean` / `stash`.** Establish facts first.
2. Locate the lost commits: `git reflog -30`, and `git log --all --oneline`.
3. **Pin them immediately** — this costs nothing and can only help:
   ```bash
   git branch wip/recovery-<date> <sha>
   git tag wip-recovery-<date> <sha>
   ```
4. Back the reflog up outside the repo: `git reflog -50 > /somewhere/reflog.txt`
5. Check the remote — a pushed commit is the strongest recovery source:
   ```bash
   git ls-remote origin
   ```
6. Identify **what actually survived** by taking a unique signature (a function name, a comment
   string) for each change and `grep`-ing the working tree. Files untracked in the old commit
   survive; tracked ones do not. Do not trust recollection — grep.
7. Back up surviving uncommitted content **before** any restore.
8. Only then restore (`git fetch && git reset --hard origin/<branch>`), and re-apply the
   surviving pieces on top.
