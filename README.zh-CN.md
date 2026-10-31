# SuperSpec

[English](README.md) | 简体中文 · [Apache-2.0 许可证](LICENSE)

SuperSpec 把功能交付、编码、根因调查、独立评审和兼容 OpenSpec 的持续规格整理成
可移植的 Agent Skills（供编程助手读取的工作说明）。Claude Code、Codex、Pi 和
OpenCode 共用一套文件，不需要安装工作流运行引擎。

## 从 npm/Pi 或检出目录安装

已有的 npm/Pi 分发名称是 `@lbk-open/super-spec`；源码检出目录保留本地包名
`super-spec`。按照 [INSTALL.md](INSTALL.md) 选择 Pi 包、本地插件或手动复制，
安装前必须明确用户选择的助手和项目/全局范围。
[Pi 市场条目](https://pi.dev/packages/@lbk-open/super-spec) 和此前 npm 0.1.1
版本证明已有此分发渠道，不代表 0.2.0 已发布；安装指定版本前需查询注册表现有版本。
安装后可以说：

- 使用 ss-feature-workflow 实现这个需求。
- 使用 ss-coding-workflow 的 lite 模式执行这个已批准计划。
- 使用 ss-troubleshooting-workflow 调查并修复这个问题。

全部 20 个 ss-* 目录必须并排安装，包括 ss-references 和 ss-guardrails。
更改助手发现目录需要用户同意；工作流不会为了恢复而自动安装依赖或修改全局配置。

## 交付方式

每个共享代码边界由同一个持续负责人调查、规划、编码和修复。主助手只负责调度和
裁决，子助手继承父助手实际模型。负责人先用定向测试证明行为失败，再做最小修复，
最后重构并检查相关回归。新的只读独立评审完成后，唯一保留的验证助手才运行全量
检查。评审缺失或真实测试失败都不能宣称完成；修复交回原负责人，进行新的影响评审
并由原验证助手重新验证。

提案和适用规格变更必须在提案批准之前完成并验证。修复首先用证据确认根因；恢复
已有承诺且语义不变时，可以提供明确的规格依据和无需变更规格的理由。批准前不能
写项目时，使用受保护的外部验证镜像。复用简短计划，落入完全相同的已批准内容，
在评审之前归档规格并完成必要的变基。仅在已有 Git 写入授权时，于评审之前完成
必要提交；拉取请求只能使用已经评审和全量验证绑定的提交身份，否则如实交付本地
结果。评审、全量验证和交付绑定当前实际输入，包括 HEAD、索引和差异，不能只看
文件内容相同；发布阶段不能晚提交、偷偷修复或变基。

参数只影响本次调用：--auto/-a 自动完成符合条件的政策关卡，不伪造人工批准；
--decide/-d 允许在有界选项中做决定，但不能跳过关卡。--worktree/-w 和
--no-worktree/-W 选择获准的工作目录。支持 -adw/-daW 组合，-wW 冲突必须停止。
交接和恢复保留参数、人工/自动/待完成的关卡状态、范围和工作目录，使用一个受保护
的外部检查点。不能替换状态不明的写入者，也不能自动切换命令行协议或模型。

full 模式交付真实的拉取请求，或在权限限制下如实交付本地结果；lite 模式本地交付，
质量要求相同。二者都不自动授权合并、部署、发布、破坏性清理或扩大范围。多仓库
必须具备真实的原生工作目录、子助手调度和终态结果能力，并明确依赖顺序。

## 技能目录

| 技能 | 用途 |
| --- | --- |
| [ss-feature-workflow](skills/ss-feature-workflow/SKILL.md) | 从需求到提案/规格关卡和交付 |
| [ss-coding-workflow](skills/ss-coding-workflow/SKILL.md) | 从已批准计划到验证后的交付 |
| [ss-troubleshooting-workflow](skills/ss-troubleshooting-workflow/SKILL.md) | 从根因确认到修复交付 |
| [ss-multi-repo-workflow](skills/ss-multi-repo-workflow/SKILL.md) | 按依赖调度多个仓库 |
| [ss-proposal](skills/ss-proposal/SKILL.md) | 架构、接口/界面契约和规格变更 |
| [ss-plan](skills/ss-plan/SKILL.md) | 简短可复用的行为、接口和测试意图计划 |
| [ss-inspect](skills/ss-inspect/SKILL.md) | 只输出报告的证据调查 |
| [ss-coding](skills/ss-coding/SKILL.md) | 持续负责人测试开发、评审和最终验证 |
| [ss-code-review](skills/ss-code-review/SKILL.md) | 新的只读因果影响评审 |
| [ss-create-branch](skills/ss-create-branch/SKILL.md) | 安全准备获准工作目录 |
| [ss-create-pr](skills/ss-create-pr/SKILL.md) | 仅发布已验证结果 |
| [ss-cleanup](skills/ss-cleanup/SKILL.md) | 独立授权的精确路径清理 |
| [ss-write-spec](skills/ss-write-spec/SKILL.md) | 编写严格的 OpenSpec 变更规格 |
| [ss-archive](skills/ss-archive/SKILL.md) | 评审前合入权威规格 |
| [ss-show-spec](skills/ss-show-spec/SKILL.md) | 读取能力规格 |
| [ss-trace-spec](skills/ss-trace-spec/SKILL.md) | 追踪规格到源码 |
| [ss-list-changes](skills/ss-list-changes/SKILL.md) | 查看活跃和已归档变更 |
| [ss-reverse-spec](skills/ss-reverse-spec/SKILL.md) | 从实际源码建立基线规格 |
| [ss-guardrails](skills/ss-guardrails/SKILL.md) | 安全、质量和语言检查参考 |
| [ss-references](skills/ss-references/SKILL.md) | 公共政策和模板，不是独立工作流 |

## 文档和验证

- [工作流顺序和参数](docs/workflows.md)
- [角色、等待和恢复](docs/multi-agent.md)
- [工作目录与多仓库](docs/worktree-and-multi-repo.md)
- [持续规格](docs/spec-driven.md) · [安全质量规则](docs/guardrails.md)
- [架构](docs/architecture.md) · [安全](SECURITY.md) · [更新记录](CHANGELOG.md)
- 仅完整源码检出目录提供：`AGENTS.md`（仓库指南）、`RELEASING.md`（发布边界）

npm 包包含技能、文档、本地插件清单和 Codex 图标，不包含 Git 历史、仓库指令、
测试或发布工具。开发和发布需使用完整检出目录；现有 GitHub v0.2.0 标签并非修复后
npm 候选包的源码身份，详见检出目录中的 `RELEASING.md`。

完整检出目录使用 `./scripts/validate.sh` 验证；Node 测试检查静态提示契约及削弱条款的失败，
不证明真实助手或平台已经执行成功。工作流本身不需要 Node 辅助程序。原生安装、
技能发现和宿主行为需要单独获准的真实验证；缺少工具必须如实披露，不能当作通过。
