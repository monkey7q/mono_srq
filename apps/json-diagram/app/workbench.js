"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Select, Space, Tag } from "tdesign-react";
import {
  AppIcon,
  ChartBubbleIcon,
  CheckCircleFilledIcon,
  CodeIcon,
  DataBaseIcon,
  Edit1Icon,
  FileCopyIcon,
  HelpCircleIcon,
  HistoryIcon,
  RollbackIcon,
  SaveIcon,
  Setting1Icon,
} from "tdesign-icons-react";

const samplePrompt =
  "请生成一个电商平台的分层技术架构图，包含接入层、应用层和数据层，并在应用层体现用户中心、订单中心和支付中心。";

const initialResultText = "等待生成...";

const helpSections = [
  {
    title: "工作区",
    body: "输入自然语言后调用 DeepSeek 生成 Diagram JSON，再由本地逻辑生成稳定 Prompt。",
  },
  {
    title: "版本管理",
    body: "第一版会保存每次生成的输入、Diagram JSON 和 Prompt，方便查看和继续编辑。",
  },
  {
    title: "编辑与重新生成",
    body: "你可以在结果页直接编辑 Diagram JSON，重新校验后生成新的 Prompt，而不再次请求模型。",
  },
];

function Field({ label, hint, children }) {
  return (
    <label className="field-block">
      <div className="field-block__topline">
        <span className="field-block__label">{label}</span>
        {hint ? <span className="field-block__hint">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

function StatusPill({ kind, text }) {
  return (
    <div className={`status-pill status-pill--${kind}`}>
      <CheckCircleFilledIcon />
      <span>{text}</span>
    </div>
  );
}

function ResultCard({ title, subtitle, icon, children }) {
  return (
    <Card className="result-card" bordered>
      <div className="result-card__header">
        <span className="result-card__icon">{icon}</span>
        <div>
          <div className="result-card__title">{title}</div>
          <div className="result-card__subtitle">{subtitle}</div>
        </div>
      </div>
      <div className="result-card__content">{children}</div>
    </Card>
  );
}

function HelpCard({ title, body }) {
  return (
    <Card className="help-card" bordered>
      <div className="help-card__title">{title}</div>
      <div className="help-card__body">{body}</div>
    </Card>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function WorkbenchPage() {
  const [section, setSection] = useState("workspace");
  const [workspaceView, setWorkspaceView] = useState("compose");
  const [resultMode, setResultMode] = useState("view");
  const [presets, setPresets] = useState([]);
  const [presetLoading, setPresetLoading] = useState(true);
  const [formData, setFormData] = useState({
    prompt: samplePrompt,
    diagramType: "layered_architecture",
    presetId: "enterprise_blueprint",
  });
  const [status, setStatus] = useState({
    kind: "idle",
    text: "Preset 加载中...",
  });
  const [issues, setIssues] = useState([]);
  const [provider, setProvider] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [diagramText, setDiagramText] = useState(initialResultText);
  const [generationPrompt, setGenerationPrompt] = useState(initialResultText);
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyDetail, setHistoryDetail] = useState(null);
  const [historyDetailLoading, setHistoryDetailLoading] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPresets() {
      try {
        const response = await fetch("/api/presets");
        const payload = await response.json();

        if (!payload.ok) {
          throw new Error("Failed to load presets.");
        }

        if (cancelled) {
          return;
        }

        const loadedPresets = payload.presets || [];
        const firstPreset = loadedPresets[0]?.id || "enterprise_blueprint";

        setPresets(loadedPresets);
        setFormData((current) => ({
          ...current,
          presetId: current.presetId || firstPreset,
        }));
        setStatus({
          kind: "idle",
          text: "工作区就绪",
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStatus({
          kind: "error",
          text: "Preset 加载失败",
        });
        setIssues([error.message]);
      } finally {
        if (!cancelled) {
          setPresetLoading(false);
        }
      }
    }

    loadPresets();

    return () => {
      cancelled = true;
    };
  }, []);

  const presetOptions = useMemo(
    () =>
      presets.map((preset) => ({
        label: `${preset.label} (${preset.id})`,
        value: preset.id,
      })),
    [presets]
  );

  async function fetchHistoryList() {
    setHistoryLoading(true);
    try {
      const response = await fetch("/api/records");
      const payload = await response.json();

      if (!payload.ok) {
        throw new Error(payload.error || "Failed to load records.");
      }

      setHistoryList(payload.records || []);
      return payload.records || [];
    } catch (error) {
      setIssues([error.message]);
      setStatus({
        kind: "error",
        text: "历史记录加载失败",
      });
      return [];
    } finally {
      setHistoryLoading(false);
    }
  }

  async function openHistoryDetail(id) {
    setHistoryDetailLoading(true);
    try {
      const response = await fetch(`/api/records/${id}`);
      const payload = await response.json();

      if (!payload.ok) {
        throw new Error(payload.error || "Failed to load record.");
      }

      setHistoryDetail(payload.record);
    } catch (error) {
      setIssues([error.message]);
      setStatus({
        kind: "error",
        text: "历史详情加载失败",
      });
    } finally {
      setHistoryDetailLoading(false);
    }
  }

  async function switchToHistory() {
    setSection("history");
    const list = await fetchHistoryList();
    if (!historyDetail && list.length > 0) {
      await openHistoryDetail(list[0].id);
    }
  }

  function resetToWorkspace() {
    setSection("workspace");
    setWorkspaceView("compose");
    setResultMode("view");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus({
      kind: "loading",
      text: "正在生成 Diagram JSON...",
    });
    setIssues([]);
    setDiagramText("生成中...");
    setGenerationPrompt("生成中...");

    try {
      const response = await fetch("/api/pipeline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      setProvider(result.provider || null);

      if (!result.ok) {
        setStatus({
          kind: "error",
          text: `执行失败：${result.stage || result.error || "未知错误"}`,
        });
        setIssues(result.errors || [result.error || "Unknown error"]);
        setDiagramText(
          result.draft ? JSON.stringify(result.draft, null, 2) : "无可展示草稿"
        );
        setGenerationPrompt("未生成");
        setWorkspaceView("compose");
        return;
      }

      setStatus({
        kind: "success",
        text: "生成成功",
      });
      setCurrentRecordId(null);
      setHistoryDetail(null);
      setDiagramText(JSON.stringify(result.diagram, null, 2));
      setGenerationPrompt(result.generationPrompt);
      setWorkspaceView("result");
      setResultMode("view");
      setSection("workspace");
    } catch (error) {
      setStatus({
        kind: "error",
        text: "请求失败",
      });
      setIssues([error.message]);
      setDiagramText("请求失败");
      setGenerationPrompt("请求失败");
      setWorkspaceView("compose");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegenerate() {
    setRegenerating(true);
    setStatus({
      kind: "loading",
      text: "正在根据 JSON 重新生成 Prompt...",
    });
    setIssues([]);

    try {
      const response = await fetch("/api/pipeline/regenerate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ diagramJson: diagramText }),
      });

      const payload = await response.json();
      if (!payload.ok) {
        throw new Error((payload.errors && payload.errors[0]) || payload.error || "Regeneration failed.");
      }

      setDiagramText(JSON.stringify(payload.diagram, null, 2));
      setGenerationPrompt(payload.generationPrompt);
      setStatus({
        kind: "success",
        text: "Prompt 已根据 JSON 重新生成",
      });
      setResultMode("view");
    } catch (error) {
      setStatus({
        kind: "error",
        text: "JSON 校验失败",
      });
      setIssues([error.message]);
    } finally {
      setRegenerating(false);
    }
  }

  async function handleSaveRecord(updateExisting) {
    setSaving(true);
    setIssues([]);

    const payload = {
      inputPrompt: formData.prompt,
      diagramType: formData.diagramType,
      presetId: formData.presetId,
      provider: provider?.provider || "deepseek",
      diagramJson: diagramText,
      generationPrompt,
      status: "generated",
    };

    try {
      const url =
        updateExisting && currentRecordId
          ? `/api/records/${currentRecordId}`
          : "/api/records";
      const method = updateExisting && currentRecordId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || "Failed to save record.");
      }

      setCurrentRecordId(result.record.id);
      setHistoryDetail(result.record);
      setStatus({
        kind: "success",
        text: updateExisting ? "记录已更新" : "记录已保存",
      });
      await fetchHistoryList();
    } catch (error) {
      setStatus({
        kind: "error",
        text: "保存失败",
      });
      setIssues([error.message]);
    } finally {
      setSaving(false);
    }
  }

  function fillSample() {
    setFormData((current) => ({
      ...current,
      prompt: samplePrompt,
    }));
  }

  function clearPrompt() {
    setFormData((current) => ({
      ...current,
      prompt: "",
    }));
  }

  function loadRecordIntoWorkspace(record) {
    setCurrentRecordId(record.id);
    setFormData({
      prompt: record.inputPrompt,
      diagramType: record.diagramType,
      presetId: record.presetId,
    });
    setProvider({ provider: record.provider });
    setDiagramText(record.diagramJson);
    setGenerationPrompt(record.generationPrompt);
    setSection("workspace");
    setWorkspaceView("result");
    setResultMode("view");
    setStatus({
      kind: "idle",
      text: "已载入历史记录",
    });
  }

  return (
    <main className="studio-shell">
      <aside className="studio-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand__logo">
            <AppIcon />
          </span>
          <div>
            <div className="sidebar-brand__title">JSON Diagram</div>
            <div className="sidebar-brand__subtitle">Workbench</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav__item ${section === "workspace" ? "sidebar-nav__item--active" : ""}`}
            type="button"
            onClick={resetToWorkspace}
          >
            <span className="sidebar-nav__icon">
              <Edit1Icon />
            </span>
            <span>工作区</span>
          </button>
          <button
            className={`sidebar-nav__item ${section === "history" ? "sidebar-nav__item--active" : ""}`}
            type="button"
            onClick={switchToHistory}
          >
            <span className="sidebar-nav__icon">
              <HistoryIcon />
            </span>
            <span>版本管理</span>
          </button>
          <button
            className={`sidebar-nav__item ${section === "help" ? "sidebar-nav__item--active" : ""}`}
            type="button"
            onClick={() => setSection("help")}
          >
            <span className="sidebar-nav__icon">
              <HelpCircleIcon />
            </span>
            <span>帮助</span>
          </button>
        </nav>

        <Card bordered className="sidebar-meta-card">
          <div className="sidebar-meta-card__block">
            <span className="sidebar-meta-card__label">Provider</span>
            <span className="sidebar-meta-card__value">
              {provider?.provider || "deepseek"}
            </span>
          </div>
          <div className="sidebar-meta-card__block">
            <span className="sidebar-meta-card__label">Preset</span>
            <span className="sidebar-meta-card__subvalue">
              {formData.presetId || "enterprise_blueprint"}
            </span>
          </div>
        </Card>
      </aside>

      <section className="studio-main">
        {section === "workspace" && workspaceView === "compose" ? (
          <section className="compose-view">
            <section className="hero-card">
              <div className="hero-copy">
                <div className="hero-copy__eyebrow">Stage 3</div>
                <h1 className="hero-copy__title">JSON Diagram Workbench</h1>
                <p className="hero-copy__summary">
                  先生成结构化 Diagram JSON，再进入结果工作区编辑 JSON、重新生成 Prompt，并保存历史记录。
                </p>
                <div className="hero-copy__tags">
                  <Tag theme="success" variant="light">
                    编辑 JSON
                  </Tag>
                  <Tag theme="primary" variant="light">
                    保存历史
                  </Tag>
                  <Tag theme="default" variant="light">
                    SQLite + Prisma
                  </Tag>
                </div>
              </div>

              <div className="hero-visual" aria-hidden="true">
                <div className="hero-visual__panel hero-visual__panel--front" />
                <div className="hero-visual__panel hero-visual__panel--back" />
                <div className="hero-visual__orb hero-visual__orb--one" />
                <div className="hero-visual__orb hero-visual__orb--two" />
                <div className="hero-visual__orb hero-visual__orb--three" />
              </div>
            </section>

            <Card bordered className="compose-card">
              <div className="compose-card__header">
                <div>
                  <div className="section-kicker">Compose</div>
                  <h2 className="section-title">输入工作区</h2>
                </div>
                <StatusPill kind={status.kind} text={status.text} />
              </div>

              <form onSubmit={handleSubmit} className="compose-form">
                <div className="compose-form__meta">
                  <Field label="提供方">
                    <div className="input-chip">
                      <Setting1Icon />
                      <span>deepseek</span>
                    </div>
                  </Field>

                  <Field label="图类型">
                    <div className="input-chip">
                      <CodeIcon />
                      <span>{formData.diagramType}</span>
                    </div>
                  </Field>

                  <Field label="风格预设">
                    <Select
                      className="workbench-select"
                      value={formData.presetId}
                      options={presetOptions}
                      loading={presetLoading}
                      onChange={(value) =>
                        setFormData((current) => ({
                          ...current,
                          presetId: value,
                        }))
                      }
                    />
                  </Field>
                </div>

                <Field
                  label="自然语言需求"
                  hint="描述你希望生成的架构层级、关键模块与依赖关系。"
                >
                  <textarea
                    className="native-textarea"
                    value={formData.prompt}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        prompt: event.target.value,
                      }))
                    }
                    rows={10}
                    placeholder="请描述你的需求，描述要生成的电商平台分层架构图..."
                  />
                </Field>

                {issues.length > 0 ? (
                  <Alert
                    theme="error"
                    title="执行反馈"
                    message={
                      <ul className="issue-list">
                        {issues.map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    }
                  />
                ) : null}

                <div className="compose-form__footer">
                  <div className="compose-form__hint">
                    当前阶段的保存单元是完整快照：原始输入、Diagram JSON、Generation Prompt。
                  </div>

                  <Space size={12} wrap>
                    <Button variant="outline" onClick={fillSample}>
                      填充示例
                    </Button>
                    <Button variant="text" onClick={clearPrompt}>
                      清空输入
                    </Button>
                    <Button type="submit" theme="primary" loading={submitting}>
                      生成 JSON
                    </Button>
                  </Space>
                </div>
              </form>
            </Card>
          </section>
        ) : null}

        {section === "workspace" && workspaceView === "result" ? (
          <section className="result-view">
            <div className="result-toolbar">
              <div>
                <div className="section-kicker">Result Workspace</div>
                <h2 className="section-title">输出结果</h2>
              </div>

              <Space size={12} wrap>
                <StatusPill kind={status.kind} text={status.text} />
                <Button
                  variant="outline"
                  icon={<Edit1Icon />}
                  onClick={() =>
                    setResultMode((current) =>
                      current === "edit" ? "view" : "edit"
                    )
                  }
                >
                  {resultMode === "edit" ? "完成编辑" : "编辑 JSON"}
                </Button>
                <Button
                  variant="outline"
                  loading={regenerating}
                  icon={<RollbackIcon />}
                  onClick={handleRegenerate}
                >
                  重新生成 Prompt
                </Button>
                <Button
                  variant="outline"
                  loading={saving}
                  icon={<SaveIcon />}
                  onClick={() => handleSaveRecord(false)}
                >
                  保存记录
                </Button>
                {currentRecordId ? (
                  <Button
                    theme="primary"
                    loading={saving}
                    icon={<FileCopyIcon />}
                    onClick={() => handleSaveRecord(true)}
                  >
                    更新当前记录
                  </Button>
                ) : null}
              </Space>
            </div>

            {issues.length > 0 ? (
              <Alert
                theme="error"
                title="结果区反馈"
                message={
                  <ul className="issue-list">
                    {issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                }
              />
            ) : null}

            <div className="result-split">
              <ResultCard
                title="Diagram JSON"
                subtitle="支持直接编辑，再触发校验与 Prompt 重生成"
                icon={<DataBaseIcon />}
              >
                {resultMode === "edit" ? (
                  <textarea
                    className="editor-textarea"
                    value={diagramText}
                    onChange={(event) => setDiagramText(event.target.value)}
                  />
                ) : (
                  <pre className="result-card__body">{diagramText}</pre>
                )}
              </ResultCard>

              <ResultCard
                title="Generation Prompt"
                subtitle="当前与 Diagram JSON 对应的最终生成指令"
                icon={<ChartBubbleIcon />}
              >
                <pre className="result-card__body">{generationPrompt}</pre>
              </ResultCard>
            </div>
          </section>
        ) : null}

        {section === "history" ? (
          <section className="history-view">
            <div className="result-toolbar">
              <div>
                <div className="section-kicker">History</div>
                <h2 className="section-title">版本管理</h2>
              </div>
              <StatusPill
                kind={historyLoading || historyDetailLoading ? "loading" : "idle"}
                text={historyLoading || historyDetailLoading ? "加载中..." : "可查看历史详情"}
              />
            </div>

            <div className="history-split">
              <Card className="history-list-card" bordered>
                <div className="history-list-card__title">历史记录</div>
                <div className="history-list">
                  {historyList.length === 0 ? (
                    <div className="history-empty">
                      {historyLoading ? "正在加载..." : "还没有保存过任何记录。"}
                    </div>
                  ) : (
                    historyList.map((record) => (
                      <button
                        key={record.id}
                        className={`history-item ${
                          historyDetail?.id === record.id ? "history-item--active" : ""
                        }`}
                        type="button"
                        onClick={() => openHistoryDetail(record.id)}
                      >
                        <div className="history-item__title">{record.title}</div>
                        <div className="history-item__meta">
                          <span>{record.presetId}</span>
                          <span>{formatDate(record.createdAt)}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </Card>

              <Card className="history-detail-card" bordered>
                {historyDetail ? (
                  <div className="history-detail">
                    <div className="history-detail__header">
                      <div>
                        <div className="history-detail__title">{historyDetail.title}</div>
                        <div className="history-detail__meta">
                          <span>{historyDetail.provider}</span>
                          <span>{historyDetail.presetId}</span>
                          <span>{formatDate(historyDetail.updatedAt)}</span>
                        </div>
                      </div>
                      <Button
                        theme="primary"
                        onClick={() => loadRecordIntoWorkspace(historyDetail)}
                      >
                        载入工作区
                      </Button>
                    </div>

                    <div className="history-detail__section">
                      <div className="history-detail__section-title">原始输入</div>
                      <div className="history-detail__text">{historyDetail.inputPrompt}</div>
                    </div>

                    <div className="history-detail__grid">
                      <ResultCard
                        title="Diagram JSON"
                        subtitle="保存时的结构化结果"
                        icon={<DataBaseIcon />}
                      >
                        <pre className="result-card__body">{historyDetail.diagramJson}</pre>
                      </ResultCard>
                      <ResultCard
                        title="Generation Prompt"
                        subtitle="保存时的最终生成指令"
                        icon={<ChartBubbleIcon />}
                      >
                        <pre className="result-card__body">
                          {historyDetail.generationPrompt}
                        </pre>
                      </ResultCard>
                    </div>
                  </div>
                ) : (
                  <div className="history-empty history-empty--detail">
                    选择一条历史记录以查看详情。
                  </div>
                )}
              </Card>
            </div>
          </section>
        ) : null}

        {section === "help" ? (
          <section className="help-view">
            <div className="result-toolbar">
              <div>
                <div className="section-kicker">Help</div>
                <h2 className="section-title">帮助</h2>
              </div>
            </div>

            <div className="help-grid">
              {helpSections.map((item) => (
                <HelpCard key={item.title} title={item.title} body={item.body} />
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
