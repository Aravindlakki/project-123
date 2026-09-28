import React, { useState } from 'react';
import {
  Badge,
  Button,
  SocialButton,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  PasswordInput,
  Textarea,
  Select,
  Switch,
  Tooltip,
  Tabs,
  Divider,
  StatCard,
  Avatar,
  AvatarGroup,
  Progress,
  CircularProgress,
  Alert,
  Modal,
  DataTable,
  Column,
} from '../components/ui';
import {
  Sparkles,
  Users,
  Briefcase,
  TrendingUp,
  Search,
  Mail,
  Shield,
  Send,
  Download,
  Filter,
  Eye,
  Sliders,
  Bell,
  Code2,
  ExternalLink,
  Layers,
  Palette,
  CheckCircle,
} from 'lucide-react';

interface MockCandidate {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  status: 'active' | 'in_review' | 'contacted' | 'rejected';
  score: number;
  lastActive: string;
}

const mockCandidates: MockCandidate[] = [
  {
    id: '1',
    name: 'Aravind Reddy',
    email: 'aravind@placemein.com',
    role: 'Staff ML Engineer',
    company: 'Anthropic',
    status: 'active',
    score: 98,
    lastActive: '10m ago',
  },
  {
    id: '2',
    name: 'Divya Sharma',
    email: 'divya.s@techcorp.io',
    role: 'Principal Frontend Architect',
    company: 'Stripe',
    status: 'in_review',
    score: 94,
    lastActive: '1h ago',
  },
  {
    id: '3',
    name: 'Karthik Raja',
    email: 'karthik@cloudscale.net',
    role: 'Engineering Director',
    company: 'Databricks',
    status: 'contacted',
    score: 91,
    lastActive: '3h ago',
  },
  {
    id: '4',
    name: 'Pooja Iyer',
    email: 'pooja.iyer@fintech.dev',
    role: 'Senior Product Designer',
    company: 'Figma',
    status: 'active',
    score: 96,
    lastActive: '2d ago',
  },
];

export const DesignSystemShowcasePage: React.FC = () => {
  const [activeShowcaseTab, setActiveShowcaseTab] = useState('all');
  const [switchState1, setSwitchState1] = useState(true);
  const [switchState2, setSwitchState2] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [progressVal, setProgressVal] = useState(68);
  const [tableSearch, setTableSearch] = useState('');

  const filteredCandidates = mockCandidates.filter(
    (c) =>
      c.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
      c.role.toLowerCase().includes(tableSearch.toLowerCase()) ||
      c.company.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const tableColumns: Column<MockCandidate>[] = [
    {
      key: 'name',
      header: 'Candidate / Contact',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <Avatar name={item.name} size="sm" status={item.status === 'active' ? 'online' : 'away'} />
          <div>
            <div className="font-bold text-white text-xs sm:text-sm">{item.name}</div>
            <div className="text-[11px] text-neutral-400 font-mono">{item.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role & Target Company',
      render: (item) => (
        <div>
          <div className="font-semibold text-neutral-200 text-xs sm:text-sm">{item.role}</div>
          <div className="text-[11px] text-neutral-400">{item.company}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (item) => {
        const variantMap: Record<string, any> = {
          active: 'success',
          in_review: 'primary',
          contacted: 'amber',
          rejected: 'danger',
        };
        const labelMap: Record<string, string> = {
          active: 'Active',
          in_review: 'In Review',
          contacted: 'Contacted',
          rejected: 'Archived',
        };
        return (
          <Badge variant={variantMap[item.status]} size="sm" dot>
            {labelMap[item.status]}
          </Badge>
        );
      },
    },
    {
      key: 'score',
      header: 'Match Score',
      align: 'right',
      sortable: true,
      render: (item) => (
        <span className="font-mono tabular-nums font-bold text-neutral-100 text-xs sm:text-sm">
          {item.score}%
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: () => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="xs">
            Review
          </Button>
          <Button variant="outline" size="xs">
            Reach Out
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-[#0B0F19] to-purple-950/40 border border-neutral-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/50 border border-purple-500/40 text-purple-300 text-xs font-semibold">
            <Palette className="h-3.5 w-3.5 text-purple-400" />
            <span>PLACEMEIN Design System · 14 Component Families</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Component Tokens & UI Specification
          </h1>
          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
            Dark luxury recruitment interface tokens crafted with precision: deep Obsidian slate
            canvases, subtle hairline borders, high-contrast badges, interactive cards, and zero AI
            slop.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Component Family Navigation */}
      <div className="sticky top-14 z-30 bg-[#030712]/80 backdrop-blur-md py-3 border-y border-neutral-800/80 -mx-3 px-3 sm:-mx-6 sm:px-6">
        <Tabs
          tabs={[
            { id: 'all', label: 'All Components' },
            { id: 'badges', label: '1. Badges & Chips' },
            { id: 'buttons', label: '2. Buttons & Social' },
            { id: 'cards', label: '3. Cards & Containers' },
            { id: 'forms', label: '4. Inputs & Forms' },
            { id: 'metrics', label: '5. Stat Metrics' },
            { id: 'tables', label: '6. Data Tables' },
            { id: 'feedback', label: '7. Alerts & Modals' },
          ]}
          activeTab={activeShowcaseTab}
          onChange={setActiveShowcaseTab}
          size="sm"
        />
      </div>

      {/* 1. BADGES & CHIPS */}
      {(activeShowcaseTab === 'all' || activeShowcaseTab === 'badges') && (
        <section id="badges" className="space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
            <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
              Family 01
            </span>
            <h2 className="text-lg font-bold text-white">Badges, Chips & Status Indicators</h2>
          </div>
          <p className="text-xs text-neutral-400">
            High-contrast dark pills, subtle border colors, pulsing dot indicators, and status chips.
          </p>

          <Card padding="md" className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                Status Pills with Live Dot Indicators
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="primary" dot>
                  Active CRA
                </Badge>
                <Badge variant="success" dot>
                  Verified Candidate
                </Badge>
                <Badge variant="warning" dot>
                  Awaiting Follow-up
                </Badge>
                <Badge variant="amber" dot>
                  Admin Oversight
                </Badge>
                <Badge variant="danger" dot>
                  Escalated Overdue
                </Badge>
                <Badge variant="info" dot>
                  Sync in Progress
                </Badge>
                <Badge variant="neutral" dot>
                  Draft Status
                </Badge>
              </div>
            </div>

            <Divider />

            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                Badge Shapes & Sizes
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="primary" size="sm" shape="pill">
                  Pill Small
                </Badge>
                <Badge variant="primary" size="md" shape="pill">
                  Pill Medium
                </Badge>
                <Badge variant="primary" size="lg" shape="pill">
                  Pill Large
                </Badge>
                <Badge variant="secondary" size="sm" shape="rounded">
                  Rounded Small
                </Badge>
                <Badge variant="secondary" size="md" shape="rounded">
                  Rounded Medium
                </Badge>
                <Badge variant="secondary" size="lg" shape="rounded">
                  Rounded Large
                </Badge>
                <Badge variant="outline" size="md">
                  Outline Badge
                </Badge>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* 2. BUTTONS & SOCIAL BUTTONS */}
      {(activeShowcaseTab === 'all' || activeShowcaseTab === 'buttons') && (
        <section id="buttons" className="space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
            <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
              Family 02
            </span>
            <h2 className="text-lg font-bold text-white">Action Buttons & Social Authentication</h2>
          </div>
          <p className="text-xs text-neutral-400">
            Solid luxury gradients, secondary outlines, ghost states, loading spinners, and the "Continue with..." social buttons highlighted in the UI specification.
          </p>

          <Card padding="md" className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                "Continue with..." Social Buttons (Auth Tokens)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl">
                <SocialButton provider="google" />
                <SocialButton provider="microsoft" />
                <SocialButton provider="github" />
                <SocialButton provider="sso" />
              </div>
            </div>

            <Divider />

            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                Button Variants & Micro-states
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" leftIcon={<Sparkles className="h-4 w-4" />}>
                  Primary Solid
                </Button>
                <Button variant="amber" leftIcon={<Shield className="h-4 w-4" />}>
                  Admin Action
                </Button>
                <Button variant="secondary">Secondary Dark</Button>
                <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
                  Outline Filter
                </Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="danger">Destructive</Button>
                <Button variant="success" leftIcon={<CheckCircle className="h-4 w-4" />}>
                  Completed
                </Button>
                <Button
                  variant="primary"
                  isLoading={buttonLoading}
                  onClick={() => {
                    setButtonLoading(true);
                    setTimeout(() => setButtonLoading(false), 2000);
                  }}
                >
                  {buttonLoading ? 'Synchronizing...' : 'Click to Test Loading'}
                </Button>
              </div>
            </div>

            <Divider />

            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                Button Sizing Hierarchy
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xs">Extra Small (xs)</Button>
                <Button size="sm">Small (sm)</Button>
                <Button size="md">Medium Default (md)</Button>
                <Button size="lg">Large Hero (lg)</Button>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* 3. CARDS & CONTAINERS */}
      {(activeShowcaseTab === 'all' || activeShowcaseTab === 'cards') && (
        <section id="cards" className="space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
            <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
              Family 03
            </span>
            <h2 className="text-lg font-bold text-white">Cards, Containers & Surfaces</h2>
          </div>
          <p className="text-xs text-neutral-400">
            Obsidian slate backgrounds, single-elevation depth, hairline borders, and gradient borders.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="default">
              <CardHeader>
                <Badge variant="primary" size="sm" className="w-fit mb-1">
                  Default Surface
                </Badge>
                <CardTitle>Standard Slate Card</CardTitle>
                <CardDescription>
                  Crisp 1px border with deep background `#0B0F19` and soft shadow.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-neutral-300">
                  Ideal for sourcing forms, lead cards, and structured worksheets.
                </p>
              </CardContent>
              <CardFooter>
                <span className="text-xs text-neutral-400">Updated 10m ago</span>
                <Button variant="outline" size="xs">
                  Inspect
                </Button>
              </CardFooter>
            </Card>

            <Card variant="gradient-border">
              <CardHeader>
                <Badge variant="amber" size="sm" className="w-fit mb-1">
                  Gradient Border
                </Badge>
                <CardTitle>Aura Glow Card</CardTitle>
                <CardDescription>
                  Subtle purple-to-indigo aura border for featured spotlights.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-neutral-300">
                  Highlighted campaigns, VIP clients, and CEO admin controls.
                </p>
              </CardContent>
              <CardFooter>
                <span className="text-xs text-purple-300 font-semibold">Priority 1</span>
                <Button variant="amber" size="xs">
                  Manage
                </Button>
              </CardFooter>
            </Card>

            <Card variant="interactive">
              <CardHeader>
                <Badge variant="success" size="sm" className="w-fit mb-1">
                  Interactive State
                </Badge>
                <CardTitle>Hover Activated Card</CardTitle>
                <CardDescription>
                  Smooth micro-interaction on hover with purple boundary glow.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-neutral-300">
                  Click to inspect detailed metrics or open contact profile.
                </p>
              </CardContent>
              <CardFooter>
                <span className="text-xs text-neutral-400">Click to expand</span>
                <ExternalLink className="h-4 w-4 text-purple-400" />
              </CardFooter>
            </Card>
          </div>
        </section>
      )}

      {/* 4. INPUTS & FORM CONTROLS */}
      {(activeShowcaseTab === 'all' || activeShowcaseTab === 'forms') && (
        <section id="forms" className="space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
            <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
              Family 04
            </span>
            <h2 className="text-lg font-bold text-white">Inputs, Search & Form Controls</h2>
          </div>
          <p className="text-xs text-neutral-400">
            Dark luxury input surfaces, leading/trailing icons, validation errors, and custom toggles.
          </p>

          <Card padding="md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input
                  label="Search Candidates or Roles"
                  placeholder="e.g. Staff AI Engineer at Anthropic..."
                  leftIcon={<Search className="h-4 w-4 text-neutral-400" />}
                  rightIcon={<kbd className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 font-mono">⌘K</kbd>}
                  helperText="Press ⌘K anytime to filter active pipelines"
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="contact@company.com"
                  leftIcon={<Mail className="h-4 w-4 text-neutral-400" />}
                  required
                />

                <PasswordInput
                  label="Secure Password"
                  placeholder="••••••••••••"
                  required
                  helperText="Must be at least 8 characters with numbers & symbols"
                />

                <Input
                  label="Validation Error State Demo"
                  defaultValue="invalid-email-address@"
                  errorMessage="Please enter a valid business email address"
                />
              </div>

              <div className="space-y-4">
                <Select
                  label="Candidate Stage Pipeline"
                  options={[
                    { value: 'sourcing', label: '1. Sourcing & Discovery' },
                    { value: 'contacted', label: '2. Initial Outreach Sent' },
                    { value: 'interviewing', label: '3. Technical Interview' },
                    { value: 'offered', label: '4. Offer Extended' },
                    { value: 'placed', label: '5. Candidate Placed' },
                  ]}
                  helperText="Updates client worksheet status automatically"
                />

                <Textarea
                  label="Outreach Pitch & Notes"
                  placeholder="Describe key candidate qualifications or conversation takeaways..."
                  rows={3}
                />

                <div className="pt-2 space-y-3">
                  <p className="text-xs font-semibold text-neutral-300">Preference Switches</p>
                  <Switch
                    checked={switchState1}
                    onChange={setSwitchState1}
                    label="Automated Telegram / Slack Lead Notifications"
                    description="Receive immediate alerts when high-match candidates reply"
                  />
                  <Switch
                    checked={switchState2}
                    onChange={setSwitchState2}
                    label="Strict Supabase Realtime Synchronization"
                    description="Broadcast row locks across CRA team sheets instantly"
                  />
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* 5. STAT & METRIC CARDS */}
      {(activeShowcaseTab === 'all' || activeShowcaseTab === 'metrics') && (
        <section id="metrics" className="space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
            <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
              Family 05
            </span>
            <h2 className="text-lg font-bold text-white">Stat Metric Cards & Tabular Numerals</h2>
          </div>
          <p className="text-xs text-neutral-400">
            Big bold numbers with tabular-nums font discipline, trend percentages, and muted kickers.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Active Candidates"
              value="1,482"
              change={{ value: '+14.8%', trend: 'up', label: 'vs last week' }}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label="Qualified CRA Placements"
              value="142"
              change={{ value: '+8.2%', trend: 'up', label: 'monthly target' }}
              icon={<Briefcase className="h-5 w-5" />}
              iconBg="bg-indigo-950/70 border border-indigo-800/40 text-indigo-300"
            />
            <StatCard
              label="Outreach Conversion"
              value="34.6%"
              change={{ value: '+4.1%', trend: 'up', label: 'above benchmark' }}
              icon={<TrendingUp className="h-5 w-5" />}
              iconBg="bg-emerald-950/70 border border-emerald-800/40 text-emerald-300"
            />
            <StatCard
              label="Overdue Client Tasks"
              value="3"
              change={{ value: '-2', trend: 'down', label: 'resolved today' }}
              icon={<Bell className="h-5 w-5" />}
              iconBg="bg-amber-950/70 border border-amber-800/40 text-amber-300"
            />
          </div>

          {/* Progress & Circular Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <Card padding="md" className="space-y-3">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Linear Track Progress
              </p>
              <Progress
                value={progressVal}
                showValue
                label="Daily Candidate Outreach Goal"
                variant="gradient"
              />
              <div className="flex gap-2 pt-2">
                <Button size="xs" variant="outline" onClick={() => setProgressVal(Math.max(progressVal - 10, 0))}>
                  -10%
                </Button>
                <Button size="xs" variant="outline" onClick={() => setProgressVal(Math.min(progressVal + 10, 100))}>
                  +10%
                </Button>
              </div>
            </Card>

            <Card padding="md" className="space-y-3">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Circular Performance Ring
              </p>
              <div className="flex items-center justify-around">
                <CircularProgress value={88} label="Outreach SLA" variant="purple" />
                <CircularProgress value={94} label="Sourcing Accuracy" variant="emerald" />
                <CircularProgress value={62} label="Sheet Quota" variant="amber" />
              </div>
            </Card>

            <Card padding="md" className="space-y-3">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                User Presence & Avatar Groups
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar name="Aravind Reddy" size="md" status="online" />
                  <Avatar name="Sarah Connor" size="md" status="busy" />
                  <Avatar name="John Doe" size="md" status="away" />
                </div>
                <div>
                  <p className="text-[11px] text-neutral-400 mb-1">Collaborating Team Members</p>
                  <AvatarGroup
                    avatars={[
                      { name: 'Aravind Reddy' },
                      { name: 'Divya Sharma' },
                      { name: 'Karthik Raja' },
                      { name: 'Pooja Iyer' },
                      { name: 'Sanjay Kumar' },
                      { name: 'Ananya Roy' },
                    ]}
                    max={4}
                    size="sm"
                  />
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* 6. DATA TABLES */}
      {(activeShowcaseTab === 'all' || activeShowcaseTab === 'tables') && (
        <section id="tables" className="space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
            <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
              Family 06
            </span>
            <h2 className="text-lg font-bold text-white">Data Tables & List Views</h2>
          </div>
          <p className="text-xs text-neutral-400">
            Compact rows, hairline dividers, sortable headers, avatar identity, and responsive pagination.
          </p>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="w-full sm:w-72">
                <Input
                  placeholder="Filter candidate list..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  leftIcon={<Search className="h-4 w-4 text-neutral-400" />}
                />
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Tooltip content="Export CSV of filtered candidates" position="top">
                  <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
                    Export
                  </Button>
                </Tooltip>
                <Button variant="primary" size="sm" leftIcon={<Sparkles className="h-4 w-4" />}>
                  + Add Candidate
                </Button>
              </div>
            </div>

            <DataTable
              columns={tableColumns}
              data={filteredCandidates}
              keyExtractor={(item) => item.id}
              page={1}
              totalPages={3}
              totalItems={mockCandidates.length}
              onPageChange={() => {}}
            />
          </div>
        </section>
      )}

      {/* 7. ALERTS, TOOLTIPS & MODALS */}
      {(activeShowcaseTab === 'all' || activeShowcaseTab === 'feedback') && (
        <section id="feedback" className="space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
            <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
              Family 07
            </span>
            <h2 className="text-lg font-bold text-white">Alerts, Tooltips & Modal Dialogs</h2>
          </div>
          <p className="text-xs text-neutral-400">
            System feedback banners, interactive hover tooltips, and production-grade modal overlays.
          </p>

          <div className="space-y-3">
            <Alert
              type="info"
              title="Supabase Realtime Sync Operational"
              action={{ label: 'View Database Audit Log', onClick: () => {} }}
            >
              All CRA outreach logs are synchronized across employee & admin portals in real time.
            </Alert>

            <Alert
              type="success"
              title="Bulk Batch Upload Completed"
              onClose={() => {}}
            >
              Successfully parsed and normalized 128 candidate records from LinkedIn CSV.
            </Alert>

            <Alert
              type="warning"
              title="JD Intake Revision Notice"
              onClose={() => {}}
            >
              2 Job Descriptions have pending review approvals from the Team Lead.
            </Alert>

            <Alert
              type="danger"
              title="Escalated Task Overdue"
              action={{ label: 'Reassign Task Now', onClick: () => {} }}
            >
              Candidate follow-up with Anthropic hiring team has exceeded SLA window.
            </Alert>
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Tooltip content="Tooltip: Top position preview" position="top">
              <Button variant="outline">Hover: Top Tooltip</Button>
            </Tooltip>
            <Tooltip content="Tooltip: Bottom position preview" position="bottom">
              <Button variant="outline">Hover: Bottom Tooltip</Button>
            </Tooltip>
            <Tooltip content="Tooltip: Left position preview" position="left">
              <Button variant="outline">Hover: Left Tooltip</Button>
            </Tooltip>
            <Tooltip content="Tooltip: Right position preview" position="right">
              <Button variant="outline">Hover: Right Tooltip</Button>
            </Tooltip>

            <Button
              variant="primary"
              onClick={() => setDemoModalOpen(true)}
              leftIcon={<Layers className="h-4 w-4" />}
            >
              Launch Interactive Modal Preview
            </Button>
          </div>
        </section>
      )}

      {/* Demo Modal */}
      <Modal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        title="Candidate Profile & Outreach Review"
        description="Verify candidate credentials and outreach schedule before submission"
        icon={<Sparkles className="h-5 w-5" />}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDemoModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => setDemoModalOpen(false)}
              leftIcon={<Send className="h-4 w-4" />}
            >
              Confirm & Dispatch Outreach
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-950/40 border border-purple-800/40">
            <Avatar name="Aravind Reddy" size="lg" status="online" />
            <div>
              <h4 className="font-bold text-white text-base">Aravind Reddy</h4>
              <p className="text-xs text-purple-300">Staff ML Engineer · Anthropic</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Matched 98% with ML Core Specs</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#0D1322] border border-neutral-800">
              <p className="text-neutral-400 font-semibold mb-1">Assigned CRA</p>
              <p className="text-white font-bold">CRA Employee Portal</p>
            </div>
            <div className="p-3 rounded-xl bg-[#0D1322] border border-neutral-800">
              <p className="text-neutral-400 font-semibold mb-1">Target Role</p>
              <p className="text-white font-bold">Lead GenAI Researcher</p>
            </div>
          </div>

          <Textarea
            label="Personalized Outreach Note"
            defaultValue="Hi Aravind, I noticed your extensive experience building LLM pipelines. We have an executive opening that matches your background..."
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
};
export default DesignSystemShowcasePage;
