<!-- TRELLIS:START -->
# Trellis Instructions

These instructions are for AI assistants working in this project.

This project is managed by Trellis. The working knowledge you need lives under `.trellis/`:

- `.trellis/workflow.md` — development phases, when to create tasks, skill routing
- `.trellis/spec/` — package- and layer-scoped coding guidelines (read before writing code in a given layer)
- `.trellis/workspace/` — per-developer journals and session traces
- `.trellis/tasks/` — active and archived tasks (PRDs, research, jsonl context)

If a Trellis command is available on your platform (e.g. `/trellis:finish-work`, `/trellis:continue`), prefer it over manual steps. Not every platform exposes every command.

If you're using Codex or another agent-capable tool, additional project-scoped helpers may live in:
- `.agents/skills/` — reusable Trellis skills
- `.codex/agents/` — optional custom subagents

Managed by Trellis. Edits outside this block are preserved; edits inside may be overwritten by a future `trellis update`.

<!-- TRELLIS:END -->

# Global Interaction Rules

- **始终使用交互式问答工具**：遇到任何需要用户澄清、决策、选择或反馈的问题，必须且仅能调用 `ask_question` 工具。
- **每次问多个问题**：调用 `ask_question` 时，必须批量提出多个关键问题（至少 2 个以上），一次性收集决策信息，提升对齐效率。
- **不得输出问题在正文**：在聊天正文/Markdown 回复中严禁出现询问用户的提问内容，所有问题统一放入 `ask_question` 交互面板中。
- **不得主动中止**：严格保持工作连续性，不得主动终止流程或放弃交互。
- **始终向远程仓库提交推送**：完成功能开发、Bug 修复或 Session 结束时，必须执行 git commit 并立即执行 git push origin master 推送至 GitHub 仓库 (jiozhaoyue/ST-BgLoader)，保证云端始终具备最新代码。
