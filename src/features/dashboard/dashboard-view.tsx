import Link from "next/link";
import { ArrowUpRight, CalendarClock, CarFront, CircleAlert, Clock3, Gauge, PhilippinePeso, ShieldCheck, TrendingUp, UsersRound } from "lucide-react";
import { formatPeso } from "@/lib/formatting/philippines";
import type { DashboardData } from "@/features/dashboard/types";
import type { OrganizationAccessContext } from "@/features/permissions/types";

export function DashboardView({ data, context }: { data: DashboardData; context: OrganizationAccessContext }) {
  const firstName = context.userName.split(" ")[0];
  const maxRevenue = Math.max(...data.salesSeries.map((point) => point.revenue));
  return (
    <div className="dashboard-page">
      {context.demoMode ? <DemoModeBanner context={context} /> : null}
      <section className="dashboard-welcome">
        <div><p className="eyebrow">Wednesday, August 5</p><h2>Good evening, {firstName}.</h2><p>Here is what needs attention across {context.activeBranchName} today.</p></div>
        <div className="period-control" role="group" aria-label="Dashboard period"><button className="active">This month</button><button>Last month</button><button>Quarter</button></div>
      </section>

      <section className="metric-grid" aria-label="Inventory summary">
        <MetricCard icon={<CarFront />} label="Total inventory" value={data.metrics.total} note="Across all workflow stages" trend="+3 this month" />
        <MetricCard icon={<Gauge />} label="Available" value={data.metrics.available} note="Ready for customer inquiries" trend="56% of inventory" />
        <MetricCard icon={<Clock3 />} label="Reserved" value={data.metrics.reserved} note="Pending deal completion" trend="2 expire today" tone="warning" />
        <MetricCard icon={<TrendingUp />} label="Sold this month" value={data.metrics.soldThisMonth} note="₱12.1M booked revenue" trend="+16.7% vs Jul" tone="positive" />
      </section>

      <section className="dashboard-band">
        <div className="band-copy"><span className="band-icon"><PhilippinePeso /></span><div><p>Inventory capital overview</p><h3>{data.financials ? formatPeso(data.financials.investedInventory) : "Restricted"}</h3><small>{data.financials ? "Currently invested in active inventory" : "Your role does not include sensitive financial data"}</small></div></div>
        {data.financials ? <div className="band-metrics"><div><span>Projected revenue</span><strong>{formatPeso(data.financials.projectedRevenue)}</strong></div><div><span>Projected gross profit</span><strong>{formatPeso(data.financials.projectedGrossProfit)}</strong></div><div><span>Expected margin</span><strong>18.5%</strong></div></div> : <div className="restricted-note"><ShieldCheck size={17} /> Financial values are protected at the data layer.</div>}
      </section>

      <div className="dashboard-primary-grid">
        <section className="card sales-card">
          <div className="card-header"><div><p className="card-kicker">Performance</p><h3>Sales momentum</h3><span>Units sold and booked revenue over six months</span></div><Link href="/reports">View report <ArrowUpRight size={15} /></Link></div>
          <div className="sales-chart" aria-label="Sales revenue chart">
            <div className="chart-y-axis"><span>₱16M</span><span>₱12M</span><span>₱8M</span><span>₱4M</span><span>₱0</span></div>
            <div className="chart-plot">
              <div className="chart-gridlines">{Array.from({ length: 5 }).map((_, index) => <i key={index} />)}</div>
              <div className="chart-bars">{data.salesSeries.map((point) => <div className="chart-column" key={point.month}><div className="chart-tooltip">{point.units} units · ₱{point.revenue}M</div><span style={{ height: `${(point.revenue / maxRevenue) * 100}%` }} /><small>{point.month}</small></div>)}</div>
            </div>
          </div>
          <div className="sales-summary"><div><span className="legend-dot amber" />Booked revenue<strong>₱71.1M</strong></div><div><span className="legend-dot dark" />Units sold<strong>42</strong></div><p><TrendingUp size={15} /> August pace is 9% ahead of the six-month average.</p></div>
        </section>

        <section className="card priority-card">
          <div className="card-header"><div><p className="card-kicker">Requires action</p><h3>Priority alerts</h3><span>Ordered by operational impact</span></div><span className="count-badge">{data.alerts.length}</span></div>
          <div className="alert-list">{data.alerts.map((alert) => <article className={`priority-alert priority-${alert.level}`} key={alert.title}><span className="alert-icon"><CircleAlert size={18} /></span><div><h4>{alert.title}</h4><p>{alert.detail}</p><Link href="/vehicles">{alert.action} <ArrowUpRight size={14} /></Link></div></article>)}</div>
        </section>
      </div>

      <div className="dashboard-secondary-grid">
        <section className="card pipeline-card">
          <div className="card-header"><div><p className="card-kicker">Operations</p><h3>Inventory pipeline</h3><span>Current vehicles by workflow stage</span></div><Link href="/vehicles">Open inventory <ArrowUpRight size={15} /></Link></div>
          <div className="pipeline-list">{data.pipeline.map((stage, index) => <div className="pipeline-item" key={stage.label}><div className="pipeline-label"><span>{stage.label}</span><strong>{stage.count}</strong></div><div className="pipeline-track"><span style={{ width: `${Math.max(8, (stage.count / data.metrics.total) * 100)}%` }} /></div><small>{Math.round((stage.count / data.metrics.total) * 100)}%</small>{index < data.pipeline.length - 1 ? <i /> : null}</div>)}</div>
        </section>

        <section className="card test-drive-card">
          <div className="card-header"><div><p className="card-kicker">Today</p><h3>Upcoming test drives</h3><span>{data.testDrives.length} appointments at QC Main</span></div><CalendarClock size={20} /></div>
          <div className="appointment-list">{data.testDrives.map((drive) => <article key={`${drive.time}-${drive.customer}`}><time>{drive.time}</time><div><h4>{drive.customer}</h4><p>{drive.vehicle}</p><small><UsersRound size={13} /> {drive.agent}</small></div></article>)}</div>
          <Link className="text-link full-link" href="/test-drives">View complete schedule <ArrowUpRight size={14} /></Link>
        </section>

        <section className="card aging-card">
          <div className="card-header"><div><p className="card-kicker">Inventory aging</p><h3>Oldest unsold</h3><span>Vehicles that may need intervention</span></div><Clock3 size={20} /></div>
          <div className="aging-list">{data.oldestVehicles.map((vehicle) => <article key={vehicle.stock}><span className="vehicle-monogram">{vehicle.make.slice(0, 1)}</span><div><h4>{vehicle.year} {vehicle.make} {vehicle.model}</h4><p>{vehicle.stock} · {formatPeso(vehicle.price)}</p></div><strong>{vehicle.age}<small>days</small></strong></article>)}</div>
          <Link className="text-link full-link" href="/vehicles">Review aging inventory <ArrowUpRight size={14} /></Link>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, note, trend, tone = "neutral" }: { icon: React.ReactNode; label: string; value: number; note: string; trend: string; tone?: string }) {
  return <article className="metric-card"><div className="metric-card-top"><span className={`metric-icon metric-${tone}`}>{icon}</span><span className={`metric-trend metric-${tone}`}>{trend}</span></div><p>{label}</p><strong>{value}</strong><small>{note}</small></article>;
}

function DemoModeBanner({ context }: { context: OrganizationAccessContext }) {
  const roles = [
    ["owner", "Owner"], ["branch-manager", "Manager"], ["sales-agent", "Sales"], ["inventory-staff", "Inventory"], ["viewer", "Viewer"],
  ] as const;
  return <div className="demo-banner"><div><ShieldCheck size={17} /><span><strong>Demo workspace</strong> Explore how access changes by role.</span></div><div>{roles.map(([key, label]) => <a className={context.roleCode === key ? "active" : ""} href={`/auth/demo?role=${key}`} key={key}>{label}</a>)}</div></div>;
}
