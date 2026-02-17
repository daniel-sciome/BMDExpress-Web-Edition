import { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Typography,
  Divider,
  Select,
  Checkbox,
  Alert,
  Result,
  Card,
  Space,
} from 'antd';
import { QuestionnaireService } from 'Frontend/generated/endpoints';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// ── Question definitions ──────────────────────────────────────────────

interface QuestionDef {
  key: string;
  label: string;
  type: 'text' | 'select' | 'checkbox' | 'textarea';
  options?: string[];
  placeholder?: string;
}

const SECTIONS: { title: string; description?: string; questions: QuestionDef[] }[] = [
  {
    title: 'Section 1: Current Workflow',
    description: 'Tell us about how you produce reports today.',
    questions: [
      {
        key: 'q1',
        label: 'Q1. What report formats do you currently produce?',
        type: 'checkbox',
        options: [
          'EPA BMD Technical Guidance',
          'ICH S4/M3',
          'OECD TG',
          'Internal SOPs',
          'Other',
        ],
      },
      {
        key: 'q2',
        label: 'Q2. How do you write these reports today?',
        type: 'select',
        options: [
          'Word templates',
          'Copy-paste from previous reports',
          'Start from scratch each time',
          'Other',
        ],
      },
      {
        key: 'q3',
        label:
          'Q3. How many people are involved in authoring a single report?',
        type: 'select',
        options: ['Solo author', 'Author + reviewer', 'Team (3+)', 'Other'],
      },
      {
        key: 'q4',
        label:
          "Q4. What's the most tedious or error-prone part of report writing today?",
        type: 'textarea',
      },
    ],
  },
  {
    title: 'Section 2: Analysis Section Layout',
    description:
      'BMDExpress analysis sections could have a standard arrangement of visualizations and tables, with standard "connecting text" between them and report-specific entry fields for your interpretations. Help us understand how you would want these laid out.',
    questions: [
      {
        key: 'q5',
        label:
          'Q5. For a typical BMDExpress analysis section (e.g., dose-response modeling results, category analysis), what is the ideal arrangement of tables, charts, and narrative text?',
        type: 'textarea',
        placeholder:
          'e.g., summary table first, then dose-response curves, then narrative interpretation...',
      },
      {
        key: 'q6',
        label:
          'Q6. Which connecting text between visualizations/tables should be standard boilerplate (the same every time), and which should be editable fields where you enter report-specific interpretations?',
        type: 'textarea',
        placeholder:
          'e.g., methods descriptions are standard, but result interpretations need custom entry...',
      },
      {
        key: 'q7',
        label:
          'Q7. What report-specific entry fields would you need alongside the standard analysis layout? (e.g., study-specific interpretation, justification for model selection, notes on outliers)',
        type: 'textarea',
      },
      {
        key: 'q8',
        label:
          'Q8. Should the standard layout be fixed (same order every time) or should you be able to rearrange the order of tables, charts, and text blocks within a section?',
        type: 'select',
        options: [
          'Fixed standard layout',
          'Rearrangeable within a section',
          'Fixed by default with option to customize',
          'Other',
        ],
      },
      {
        key: 'q9',
        label:
          'Q9. How should the connecting text reference the data? (e.g., "As shown in Table X..." with auto-numbered references, or plain narrative without cross-references?)',
        type: 'select',
        options: [
          'Auto-numbered cross-references (Table X, Figure Y)',
          'Plain narrative without cross-references',
          'Both -- auto-numbered where possible, plain where not',
          'Other',
        ],
      },
    ],
  },
  {
    title: 'Section 3: Boilerplate vs. Custom Content',
    description:
      'Help us understand which report content is reusable and which is written fresh each time.',
    questions: [
      {
        key: 'q10',
        label:
          'Q10. Which sections are essentially the same across reports -- only needing minor edits like study name, dates, or chemical identity? (e.g., regulatory disclaimers, methods descriptions, statistical approach descriptions)',
        type: 'textarea',
      },
      {
        key: 'q11',
        label:
          'Q11. Which sections require substantial original writing every time? (e.g., integrated assessment, conclusions, discussion of findings)',
        type: 'textarea',
      },
      {
        key: 'q12',
        label:
          'Q12. Would you like to create a collection of standard phrases, domain-specific terminology, or a controlled vocabulary for BMD/toxicology reporting? If so, how would it be managed and where would these phrases typically appear in reports?',
        type: 'textarea',
        placeholder:
          'e.g., standard risk characterization phrases, approved statistical language, regulatory terminology glossaries...',
      },
      {
        key: 'q13',
        label:
          'Q13. Are there standard phrases, paragraphs, or tables required by your regulatory authority that should be locked/protected from editing?',
        type: 'textarea',
      },
      {
        key: 'q14',
        label:
          'Q14. Should boilerplate sections be editable or read-only? Would you want a "reset to default" option?',
        type: 'select',
        options: [
          'Editable with reset-to-default',
          'Read-only (locked)',
          'Mix -- some locked, some editable',
          'Other',
        ],
      },
    ],
  },
  {
    title: 'Section 4: Data-Driven Content',
    description:
      'Which parts of the report should pull directly from BMDExpress analysis results?',
    questions: [
      {
        key: 'q15',
        label:
          'Q15. Which sections should auto-populate from BMDExpress analysis results?',
        type: 'checkbox',
        options: [
          'BMD summary tables',
          'Dose-response curve descriptions',
          'Model fit statistics',
          'Gene pathway summaries',
          'Other',
        ],
      },
      {
        key: 'q16',
        label:
          'Q16. What summary statistics or tables do you expect to appear automatically without manual entry?',
        type: 'checkbox',
        options: [
          'BMDL/BMD/BMDU tables',
          'Model comparison tables',
          'Gene pathway summaries',
          'Dose-response parameters',
          'Other',
        ],
      },
      {
        key: 'q17',
        label: 'Q17. How should charts/figures be handled?',
        type: 'select',
        options: [
          'Auto-inserted from the analysis view',
          'Manually captured screenshots',
          'Regenerated for print quality',
          'Other',
        ],
      },
      {
        key: 'q18',
        label:
          'Q18. What level of data traceability do you need? (e.g., "this table was generated from analysis X on date Y" provenance annotations?)',
        type: 'textarea',
      },
    ],
  },
  {
    title: 'Section 5: AI-Assisted Authoring',
    description:
      'We are exploring using AI to draft certain report sections. Tell us where that would be most valuable.',
    questions: [
      {
        key: 'q19',
        label:
          'Q19. Which sections would benefit most from AI-drafted text? Select all that apply and describe your ranking in the text box below.',
        type: 'checkbox',
        options: [
          'Study overview / executive summary',
          'Methods description (dose selection rationale, statistical approach)',
          'Results narrative (describing what the data shows)',
          'Interpretation of BMD results in regulatory context',
          'Comparison to historical/literature data',
          'Conclusions and recommendations',
        ],
      },
      {
        key: 'q19_ranking',
        label:
          'Q19 (continued). Please rank the above from most to least beneficial, or add notes.',
        type: 'textarea',
        placeholder: 'e.g., 1. Results narrative, 2. Study overview, ...',
      },
      {
        key: 'q20',
        label:
          "Q20. What's your comfort level with AI-generated first drafts?",
        type: 'select',
        options: [
          'Fully trust and edit lightly',
          'Use as a starting outline only',
          'Prefer to write from scratch',
          'Other',
        ],
      },
      {
        key: 'q21',
        label:
          "Q21. Should AI-generated content be visually marked so reviewers know it wasn't human-authored?",
        type: 'select',
        options: [
          'Yes, always mark AI-generated content',
          'Optional -- let the author decide',
          "No, it shouldn't matter once reviewed",
          'Other',
        ],
      },
      {
        key: 'q22',
        label:
          'Q22. Would you want AI to pull in relevant literature or regulatory guidance (e.g., citing EPA benchmark dose guidance documents, prior assessments of the same chemical)?',
        type: 'select',
        options: [
          'Yes, that would be very helpful',
          'Maybe -- depends on accuracy',
          'No, we handle literature separately',
          'Other',
        ],
      },
      {
        key: 'q23',
        label:
          'Q23. Should AI suggest a point of departure (POD) or risk characterization language, or is that strictly a human judgment call?',
        type: 'select',
        options: [
          'AI can suggest, human decides',
          'Strictly human judgment',
          'AI can draft if clearly labeled as suggestion',
          'Other',
        ],
      },
    ],
  },
  {
    title: 'Section 6: Review & Collaboration',
    description: 'How does your team review and finalize reports?',
    questions: [
      {
        key: 'q24',
        label: 'Q24. How do you track section completion status?',
        type: 'select',
        options: [
          'Draft -> Reviewed -> Final',
          'Informal tracking',
          'No formal status tracking',
          'Other',
        ],
      },
      {
        key: 'q25',
        label:
          'Q25. Do you need commenting or track-changes functionality within the report builder, or do you export to Word for review?',
        type: 'select',
        options: [
          'Need it built-in',
          'Export to Word for review',
          'Both would be useful',
          'Other',
        ],
      },
      {
        key: 'q26',
        label:
          'Q26. Who approves the final report? Is there a formal sign-off workflow?',
        type: 'textarea',
      },
      {
        key: 'q27',
        label:
          'Q27. Do multiple people edit the same report simultaneously, or is it passed sequentially?',
        type: 'select',
        options: [
          'Simultaneous editing',
          'Sequential (one at a time)',
          'Both depending on the phase',
          'Other',
        ],
      },
    ],
  },
  {
    title: 'Section 7: Export & Compliance',
    description: 'What output formats and compliance requirements do you have?',
    questions: [
      {
        key: 'q28',
        label: 'Q28. What output formats are required?',
        type: 'checkbox',
        options: ['PDF', 'DOCX', 'Both PDF and DOCX', 'Other'],
      },
      {
        key: 'q29',
        label:
          'Q29. Are there page layout requirements -- margins, fonts, headers/footers, page numbering, logos?',
        type: 'textarea',
        placeholder: 'Describe any specific formatting requirements.',
      },
      {
        key: 'q30',
        label:
          'Q30. Do you need to generate submission-ready packages (e.g., report + supporting data files + appendices as a bundled deliverable)?',
        type: 'select',
        options: ['Yes', 'No', 'Sometimes', 'Other'],
      },
      {
        key: 'q31',
        label:
          'Q31. Are there electronic signature or audit trail requirements for the final report?',
        type: 'select',
        options: [
          'Yes, electronic signatures required',
          'Yes, audit trail required',
          'Both signatures and audit trail',
          'No',
          'Other',
        ],
      },
    ],
  },
  {
    title: 'Section 8: Template Customization',
    description:
      'How flexible do report templates need to be?',
    questions: [
      {
        key: 'q32',
        label:
          'Q32. Would you create custom templates for your organization, or only use the built-in ones (EPA, ICH, OECD)?',
        type: 'select',
        options: [
          'Built-in templates only',
          'Custom templates for our org',
          'Both built-in and custom',
          'Other',
        ],
      },
      {
        key: 'q33',
        label:
          'Q33. Should templates be shareable across team members or organizations?',
        type: 'select',
        options: [
          'Yes, shareable across team',
          'Yes, shareable across organizations',
          'No, per-user only',
          'Other',
        ],
      },
      {
        key: 'q34',
        label:
          'Q34. Do different regulatory submissions require different section structures for the same underlying data?',
        type: 'select',
        options: ['Yes', 'No', 'Sometimes', 'Other'],
      },
    ],
  },
  {
    title: 'Section 9: Open-Ended',
    description:
      'Anything else you want us to know.',
    questions: [
      {
        key: 'q35',
        label:
          'Q35. If the report builder could do one thing that would save you the most time, what would it be?',
        type: 'textarea',
      },
      {
        key: 'q36',
        label:
          "Q36. What's the biggest risk in report writing today -- errors you worry about, things that get missed?",
        type: 'textarea',
      },
      {
        key: 'q37',
        label:
          'Q37. Anything else we should know about your reporting workflow?',
        type: 'textarea',
      },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────

export default function QuestionnaireForm() {
  const [accessGranted, setAccessGranted] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form] = Form.useForm();

  // ── Access gate ───────────────────────────────────────────────────

  async function handleCodeSubmit() {
    if (!codeInput.trim()) return;
    setCodeLoading(true);
    setCodeError('');
    try {
      const valid = await QuestionnaireService.validateAccessCode(codeInput.trim());
      if (valid) {
        setAccessGranted(true);
      } else {
        setCodeError('Invalid access code. Please try again.');
      }
    } catch {
      setCodeError('Failed to validate access code. Please try again.');
    } finally {
      setCodeLoading(false);
    }
  }

  // ── Form submission ───────────────────────────────────────────────

  async function handleSubmit(values: Record<string, unknown>) {
    setSubmitLoading(true);
    setSubmitError('');
    try {
      // Flatten all form values into a string map
      const responses: Record<string, string> = {};
      for (const [key, val] of Object.entries(values)) {
        if (key === 'respondentName' || key === 'respondentEmail') continue;
        if (Array.isArray(val)) {
          responses[key] = val.join('; ');
        } else if (val != null) {
          responses[key] = String(val);
        }
      }

      await QuestionnaireService.submitResponse({
        respondentName: (values.respondentName as string) || '',
        respondentEmail: (values.respondentEmail as string) || '',
        responses,
      });
      setSubmitted(true);
    } catch {
      setSubmitError('Failed to submit. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  }

  // ── Render: Success ───────────────────────────────────────────────

  if (submitted) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px' }}>
        <Result
          status="success"
          title="Thank you!"
          subTitle="Your responses have been recorded. We appreciate your time and feedback."
        />
      </div>
    );
  }

  // ── Render: Access gate ───────────────────────────────────────────

  if (!accessGranted) {
    return (
      <div style={{ maxWidth: 420, margin: '120px auto', padding: '0 24px' }}>
        <Card>
          <Title level={3}>BMDExpress Report Builder Questionnaire</Title>
          <Paragraph>Please enter the access code to continue.</Paragraph>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="Access code"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onPressEnter={handleCodeSubmit}
              disabled={codeLoading}
            />
            <Button type="primary" onClick={handleCodeSubmit} loading={codeLoading}>
              Enter
            </Button>
          </Space.Compact>
          {codeError && (
            <Alert message={codeError} type="error" showIcon style={{ marginTop: 12 }} />
          )}
        </Card>
      </div>
    );
  }

  // ── Render: Questionnaire form ────────────────────────────────────

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px 80px' }}>
      <Title level={2}>BMDExpress Report Builder Questionnaire</Title>
      <Paragraph type="secondary">
        Help us understand your report-writing workflow so we can build the right tools.
        All fields are optional -- answer as many or as few as you like.
      </Paragraph>

      {submitError && (
        <Alert
          message={submitError}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 24 }}
          onClose={() => setSubmitError('')}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        {/* Contact info */}
        <Card title="Your Information" style={{ marginBottom: 24 }}>
          <Form.Item name="respondentName" label="Name">
            <Input placeholder="Your name" />
          </Form.Item>
          <Form.Item name="respondentEmail" label="Email">
            <Input placeholder="your.email@example.com" type="email" />
          </Form.Item>
        </Card>

        {/* Question sections */}
        {SECTIONS.map((section) => (
          <Card
            key={section.title}
            title={section.title}
            style={{ marginBottom: 24 }}
          >
            {section.description && (
              <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                {section.description}
              </Paragraph>
            )}
            {section.questions.map((q) => (
              <Form.Item key={q.key} name={q.key} label={q.label}>
                {renderField(q)}
              </Form.Item>
            ))}
          </Card>
        ))}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={submitLoading}
          >
            Submit Questionnaire
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

// ── Field renderer ────────────────────────────────────────────────────

function renderField(q: QuestionDef) {
  switch (q.type) {
    case 'select':
      return (
        <Select placeholder="Select an option" allowClear>
          {q.options?.map((opt) => (
            <Select.Option key={opt} value={opt}>
              {opt}
            </Select.Option>
          ))}
        </Select>
      );
    case 'checkbox':
      return <Checkbox.Group options={q.options} />;
    case 'textarea':
      return (
        <TextArea
          rows={3}
          placeholder={q.placeholder || 'Your answer...'}
          autoSize={{ minRows: 2, maxRows: 8 }}
        />
      );
    case 'text':
      return <Input placeholder={q.placeholder || ''} />;
    default:
      return <Input />;
  }
}
