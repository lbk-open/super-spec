# SuperSpec

[English](README.md) | 简体中文

[![CI](https://img.shields.io/github/actions/workflow/status/lbk-open/super-spec/ci.yml?branch=main&label=ci)](https://github.com/lbk-open/super-spec/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/lbk-open/super-spec?label=release)](https://github.com/lbk-open/super-spec/releases)
[![License](https://img.shields.io/github/license/lbk-open/super-spec)](LICENSE)
[![Works with Claude Code · Codex · Pi · OpenCode](https://img.shields.io/badge/Works_with-Claude_Code_%C2%B7_Codex_%C2%B7_Pi_%C2%B7_OpenCode-6E56CF)](https://github.com/lbk-open/super-spec)

> 面向 AI 编码代理的规格驱动开发工具集。

SuperSpec 将经过实战检验的工程化工作流封装为可移植的
[Agent Skills](https://agentskills.io)：端到端的需求交付流程、多代理 TDD
编码与并行代码评审、随代码共同演进的活规格（living specs），以及约束 AI
产出安全性与正确性的工程护栏（guardrails）。

支持 **Claude Code**、**OpenAI Codex**、**Pi** 与 **OpenCode** 四个运行时——
同一份 `SKILL.md` 源文件，无需按平台构建。项目借鉴了
[superpowers](https://github.com/obra/superpowers) 与
[OpenSpec](https://github.com/Fission-AI/OpenSpec) 两个优秀开源项目的设计思想，
并与 OpenSpec 目录规范完全兼容。

## 快速开始

推荐由 AI 代理代为安装——将下面这段内容粘贴到任意代理会话中（Claude Code、
Codex、Pi、OpenCode 均可）：

```
Install SuperSpec by following the instructions here:
https://raw.githubusercontent.com/lbk-open/super-spec/main/INSTALL.md
```

随后按任务类型让代理执行相应工作流：

- *"Use ss-feature-workflow to implement this requirement: …"* ——
  复杂度分诊 → 技术方案（仅复杂需求）→ 执行计划 → 多代理编码 → 评审 → PR，
  关键决策点设有人工确认。
- *"Use ss-coding-workflow in lite mode on this plan"* ——
  在当前分支就地编码与评审，省去 PR 流程。
- *"Use ss-troubleshooting-workflow: production alert says …"* ——
  基于证据的根因分析、修复与交付。

也可以直接调用任意单个 skill——每个 `SKILL.md` 都完整描述了输入与执行步骤。

## 安装

**推荐交给 AI 代理完成。** [INSTALL.md](INSTALL.md) 是一份面向代理执行的安装文档，
涵盖平台选择、安装、校验与命名冲突检查。将下面内容粘贴到代理会话即可：

```
Install SuperSpec by following the instructions here:
https://raw.githubusercontent.com/lbk-open/super-spec/main/INSTALL.md
```

如需手动安装，简要步骤如下：

- **Claude Code** —— `/plugin marketplace add lbk-open/super-spec`，随后
  `/plugin install super-spec@super-spec`。安装后以 `/ss-*` 命令形式使用。
- **OpenAI Codex** —— `codex plugin marketplace add https://github.com/lbk-open/super-spec`，
  随后 `codex plugin add super-spec@super-spec`。更新执行
  `codex plugin marketplace upgrade super-spec`。
- **Pi** —— `pi install git:github.com/lbk-open/super-spec`（不指定版本号）。
  更新执行 `pi update --all`。
- **OpenCode** —— `npx skills add lbk-open/super-spec -a opencode`。更新执行
  `npx skills update`。
- **手动兜底（Codex / Pi / OpenCode）** —— 将 `skills/*` 拷贝到
  `~/.agents/skills/`（三者共用该发现路径），并保持 `ss-*` 目录与
  `_references/` 的同级布局。项目级安装则放入 `<repo>/.agents/skills/`。

完整的安装、升级与卸载说明见 [INSTALL.md](INSTALL.md)。

## 为什么选择 SuperSpec

- **以流程保证产出质量，而非依赖顶级模型。** 规格 → 计划 → TDD 实现 →
  多维并行评审 → 护栏约束，这条流水线的设计目标是让中档模型也能稳定产出可靠代码，
  而不是把质量押在单次顶级模型输出上。
- **由模型执行工作流，而非由工具驱动。** 工作流本身就是代理直接执行的 Markdown
  指令：薄编排、人工确认点、断点续跑。无需安装任何编排 CLI、状态机或代码生成器——
  只要代理能读取 skill，就能运行完整流水线，并在实际情况偏离预设路径时自行调整。
- **端到端覆盖，而非零散片段。** 需求开发、编码、排障均从需求一直贯通到 PR，
  在真正重要的决策点设置确认关卡，会话中断后可从产物恢复继续执行。
- **full 与 lite 双交付模式。** 既可以走完整的建分支 → PR 流程，也可以在当前分支
  就地开发、以规范的 conventional commits 收尾。两种模式的质量关卡完全一致。
- **多代理编码与评审。** TDD 实现分发给并行子代理完成，再由评审组（质量、规格合规、
  集成）给出按严重级别分级的裁决，并在有限轮次内驱动修复循环。
- **活规格，兼容 OpenSpec。** delta 规格随代码同步演进——编写 → 归档 → 追溯，
  遵循 [OpenSpec](https://github.com/Fission-AI/OpenSpec) 规范（`openspec/specs`、
  `openspec/changes`、归档生命周期）。由 OpenSpec CLI 初始化的仓库可直接使用
  SuperSpec 的规格类 skills，反之亦然。
- **只设护栏，不管风格。** 安全红线、评审标准、测试原则与面向 AI 代理的防错规则
  （通用核心 + 按语言清单）。护栏从不拷贝进用户项目，由 skills 在运行时按需读取。

## 工作原理

关键 skills 执行时各自做什么：

### 开发

- **`ss-proposal`** —— 读取需求或 PRD，将其收敛到当前仓库的职责边界内，
  分析既有架构与约定，然后在 `docs/proposals/` 产出一份高层设计方案：
  架构与数据流、关键接口、备选方案与权衡、风险、里程碑。产出经过自评审
  （条件允许时另加独立评审）把关。
- **`ss-plan`** —— 将方案或需求分解为可执行的任务计划：先生成 OpenSpec delta
  规格作为验收基线，再拆解为按依赖排序的任务，每个任务的粒度都足以测试先行地
  实现与验证。计划文件同时充当持久化状态，供后续断点续跑。
- **`ss-coding`** —— 读取计划，对相互独立的任务分组，并行分发给多个 implementer
  子代理。每个子代理的提示词中都包含完整任务文本、相关 delta 规格与护栏内容，
  以测试先行方式实现。全部任务完成后运行测试套件、调用 `ss-code-review`，
  并依据修复清单循环迭代直至裁决为 APPROVED——最终报告一个经测试验证的
  commit 与一份人工验收清单。
- **`ss-code-review`** —— 将 diff 分发给多个视角各异的并行评审代理：通用代码质量、
  护栏与项目规范合规、跨模块集成。评审发现经置信度过滤与去重后，合并为按严重
  级别分级的裁决（APPROVED / NEEDS_CHANGES / CRITICAL_ISSUES），并附
  `ss-coding` 可直接执行的结构化修复清单。

### 排障

- **`ss-inspect`** —— 分阶段、证据驱动的根因分析：先锚定症状，再从多个来源
  （日志、链路追踪、指标、代码、git 历史）收集证据，建立相互竞争的假设并逐一
  证伪——可能时复现故障——最终产出根因报告，附修复建议与需要改动的仓库清单。

### 工作流

- **`ss-feature-workflow` / `ss-coding-workflow`** —— 对上述 skills 的薄编排：
  建分支 → 复杂度分诊 → 技术方案 + *[审批关卡]*（复杂需求；简单需求直接进入计划）→
  计划 → 内建评审的编码 → PR。`ss-coding-workflow` 是较短的路径，从既有计划或
  直接的修改指令开始，跳过方案阶段。两者均支持 full/lite 交付模式，会话中断后
  可从产物恢复。
- **`ss-troubleshooting-workflow`** —— 先运行 `ss-inspect`，在根因确认关卡处
  暂停，确认后才建分支，并沿同一条编码-评审路径完成修复。
- **`ss-multi-repo-workflow`** —— 面向跨仓库变更：按仓库拆分工作，在每个仓库中
  启动一个 headless 代理进程（运行 `ss-coding-workflow`），按依赖关系分批调度，
  最后将各仓库结果汇总为一份报告。编排者自身从不修改代码。

### Git 交付

- **`ss-create-branch`** —— 从需求推导出带类型前缀的分支名（`feat/`、`fix/` 等）
  并从默认分支切出——可选地在隔离的 **git worktree** 中进行（显式指定 >
  仓库约定 > 询问一次），使分支拥有独立目录：主 checkout 保持干净、并行任务
  互不干扰、中断的任务不会留下脏状态。优先使用代理原生的 worktree 工具，
  否则回退到项目内被 git 忽略的 `.worktrees/` 目录。
- **`ss-create-pr`** —— 先执行质量关卡（测试、lint、遗留调试代码扫描），
  写出规范的 conventional commits，根据 remote 识别代码托管平台（GitHub 用
  `gh`，GitLab 用 `glab`），并基于计划与规格生成描述后创建 PR。没有 remote
  或缺少 CLI 时，降级为本地提交加变更摘要——不视为失败。
- **`ss-cleanup`** —— 合并之后：删除分支与 worktree、同步默认分支；无可清理
  内容时快速退出（lite 模式）。

## Skill 目录

| 分类 | Skills |
|---|---|
| 活规格 | `ss-write-spec`、`ss-archive`、`ss-list-changes`、`ss-show-spec`、`ss-trace-spec`、`ss-reverse-spec` |
| 方案与计划 | `ss-proposal`、`ss-plan` |
| 工作流 | `ss-feature-workflow`、`ss-coding-workflow`、`ss-troubleshooting-workflow`、`ss-multi-repo-workflow` |
| 多代理 | `ss-coding`、`ss-code-review` |
| Git 交付 | `ss-create-branch`、`ss-create-pr`、`ss-cleanup` |
| 诊断 | `ss-inspect` |
| 共享 | `ss-guardrails`（安全/质量/防错清单） |

## 与同类项目的比较

这些项目目标一致——让 AI 编写的代码值得信任——但侧重的层面不同。它们之间
互补多于竞争；下表旨在说明差异，而非排出优劣。

| 项目 | 主要侧重 | 与 SuperSpec 的差异 |
|---|---|---|
| [superpowers](https://github.com/obra/superpowers) | 丰富的过程类 skill 库（头脑风暴、TDD、调试、子代理驱动开发），塑造工作纪律 | 侧重实践层面的*工作方法*；SuperSpec 在此之上补充了规格生命周期管理、端到端交付工作流（需求 → PR）与按语言划分的护栏。superpowers 以 Claude Code 为主、辅以其他代理的适配层；SuperSpec 以单一 SKILL.md 源覆盖四个运行时 |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | 规格变更管理：一套用于提出、审批与归档 spec delta 的 CLI 与规范 | 管理*要构建什么*，实现交给代理自身；SuperSpec 采纳其规格规范（完全兼容），并补上执行侧的另一半——计划、多代理编码、评审与交付 |
| [spec-kit](https://github.com/github/spec-kit) | 由 `specify` CLI 驱动的规格驱动开发：constitution → specify → plan → tasks 模板，覆盖多种代理 | 工作流依靠 CLI 生成的模板与脚本推进；SuperSpec 将编排完全保留在由模型自行执行的提示词中，叠加多代理评审与护栏，并以跨越单个需求生命周期的活规格为核心 |

如果你已在使用 OpenSpec，SuperSpec 可直接接入同一个 `openspec/` 目录；
如果你在使用 superpowers，两套 skills 可在同一代理下共存——`ss-` 前缀保证了
命名互不冲突。

## 设计文档

| 文档 | 内容 |
|---|---|
| [architecture.md](docs/architecture.md) | 设计理念、单源四运行时布局、skill 目录 |
| [workflows.md](docs/workflows.md) | 工作流编排、确认关卡、full/lite 模式、断点续跑 |
| [multi-agent.md](docs/multi-agent.md) | 多代理 TDD 与并行评审设计 |
| [spec-driven.md](docs/spec-driven.md) | 活规格：delta → 归档 → 追溯 |
| [worktree-and-multi-repo.md](docs/worktree-and-multi-repo.md) | 并行开发隔离与多仓库编排 |
| [guardrails.md](docs/guardrails.md) | 护栏为何只覆盖安全、质量与防错规则 |

## 致谢

SuperSpec 站在两个优秀开源项目的肩膀上：
[superpowers](https://github.com/obra/superpowers) 开创了将工程纪律封装为
agent skills 的先河；[OpenSpec](https://github.com/Fission-AI/OpenSpec)
定义了本工具集所依赖的 spec-delta 规范。如果 SuperSpec 不适合你的场景，
不妨了解一下它们。

## 参与贡献

欢迎提交 Issue 与 PR。仓库约定见 [AGENTS.md](AGENTS.md)。

## 卸载

- **Claude Code**

  ```
  /plugin uninstall super-spec@super-spec
  /plugin marketplace remove super-spec
  ```

- **Codex** —— `codex plugin remove super-spec`，随后可选执行
  `codex plugin marketplace remove super-spec`。
- **Pi** —— `pi remove git:github.com/lbk-open/super-spec`。
- **手动拷贝安装（Codex / Pi / OpenCode）** —— 删除安装时拷贝的内容即可
  （项目级安装或 OpenCode 备选路径请相应调整）：

  ```bash
  rm -rf ~/.agents/skills/ss-* ~/.agents/skills/_references
  ```

SuperSpec 在 skills 目录之外不保存任何状态，也从不写入你的项目，
因此没有其他需要清理的内容。详见 [INSTALL.md](INSTALL.md#uninstalling)。

## 许可证

[Apache-2.0](LICENSE)
