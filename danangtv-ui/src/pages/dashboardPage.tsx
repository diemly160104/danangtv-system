import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailDrawer, SectionHeader } from "@/features/danangtv/shared/commonComponents";
import { CalendarDays, CircleDollarSign, Clapperboard, FileText, FolderOpen } from "lucide-react";

import { 
    BookingRow, 
    BroadcastScheduleRow, 
    ChannelView, 
    ContentRow, 
    ContractRow, 
    DashboardDetailKey, 
    FileRow, 
    InvoiceRow, 
    LinkedFileSeedRow, 
    PaymentRow, 
    PaymentScheduleRow, 
    ProductionRow, 
    ProductionTaskRow, 
    ServiceItemContentRow, 
    ServiceItemProductionRow, 
    ServiceItemRow, 
    SessionUser, 
    StudioRentalRow, 
    StudioUsageRow, 
    StudioView 
} from "@/features/danangtv/types";

import { 
    formatCurrency, 
    formatDisplayDate, 
    formatScheduleDateTime, 
    formatScheduleTimeRange, 
    getChannelDisplayName, 
    getISODate, 
    statusLabel, 
    toDateInputValue 
} from "@/features/danangtv/utils/Helpers";

import { ContentFullView } from "@/features/danangtv/modules/contents";
import { ContractFullView } from "@/features/danangtv/modules/contracts";
import { ProductionFullView } from "@/features/danangtv/modules/productions";
import { ScheduleFullView } from "@/features/danangtv/modules/schedules";


export function DashboardPage({
  currentUser,
  contracts,
  contents,
  schedules,
  studioUsageSchedules,
  paymentSchedules,
  serviceItems,
  bookings,
  payments,
  invoices,
  productions,
  studioRentals,
  studios,
  channels,
  productionTasks,
  files,
  contractFileLinks,
  contentFileLinks,
  serviceItemContents,
  productionFileLinks,
  serviceItemProductions,
}: {
  currentUser: SessionUser;
  contracts: ContractRow[];
  contents: ContentRow[];
  schedules: BroadcastScheduleRow[];
  studioUsageSchedules: StudioUsageRow[];
  paymentSchedules: PaymentScheduleRow[];
  serviceItems: ServiceItemRow[];
  bookings: BookingRow[];
  payments: PaymentRow[];
  invoices: InvoiceRow[];
  productions: ProductionRow[];
  studioRentals: StudioRentalRow[];
  studios: StudioView[];
  channels: ChannelView[];
  productionTasks: ProductionTaskRow[];
  files: FileRow[];
  contractFileLinks: LinkedFileSeedRow[];
  contentFileLinks: LinkedFileSeedRow[];
  serviceItemContents: ServiceItemContentRow[];
  productionFileLinks: LinkedFileSeedRow[];
  serviceItemProductions: ServiceItemProductionRow[];
}) {
  const [detailKey, setDetailKey] = useState<DashboardDetailKey>(null);
  const [detailTitle, setDetailTitle] = useState("");
  const [detailContent, setDetailContent] = useState<React.ReactNode>(null);
  const [tvChannelFilter, setTvChannelFilter] = useState<"DNRT1" | "DNRT2">("DNRT1");
  const [subDetailTitle, setSubDetailTitle] = useState("");
  const [subDetailContent, setSubDetailContent] = useState<React.ReactNode>(null);
  const [subDetailOpen, setSubDetailOpen] = useState(false);
  const activeContracts = contracts.filter((c) => c.status === "active");
  const paymentToday = new Date();
  paymentToday.setHours(0, 0, 0, 0);

  const paymentOneWeekLater = new Date(paymentToday);
  paymentOneWeekLater.setDate(paymentToday.getDate() + 7);

  const paymentTodayKey = toDateInputValue(paymentToday.toISOString());
  const paymentOneWeekLaterKey = toDateInputValue(paymentOneWeekLater.toISOString());

  const upcomingPayments = paymentSchedules.filter((p) => {
    const dueKey = toDateInputValue(p.due_date);
    if (!dueKey) return false;

    return (
      !["paid", "cancelled"].includes(String(p.status || "").toLowerCase()) &&
      dueKey >= paymentTodayKey &&
      dueKey <= paymentOneWeekLaterKey
    );
  });

  const overduePayments = paymentSchedules.filter((p) => {
    const dueKey = toDateInputValue(p.due_date);
    if (!dueKey) return false;

    return (
      !["paid", "cancelled"].includes(String(p.status || "").toLowerCase()) &&
      dueKey < paymentTodayKey
    );
  });

  const pendingContents = contents.filter((c) => ["draft", "editing"].includes(c.status));
  const waitingSchedules = schedules.filter((s) => s.status === "planned");


  const activeProductions = productions.filter(
    (item) => item.status === "in_progress"
  );

  const today = getISODate(new Date());

  const dnrt1Channel = channels.find((item) => item.name === "DNRT1");
  const dnrt2Channel = channels.find((item) => item.name === "DNRT2");

  const todayDnrt1Schedules = schedules
    .filter(
      (item) =>
        item.scheduled_start &&
        item.scheduled_start.startsWith(today) &&
        (
          item.channel_id === dnrt1Channel?.channel_id ||
          item.channel_code === dnrt1Channel?.code
        )
    )
    .sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start));

  const todayDnrt2Schedules = schedules
    .filter(
      (item) =>
        item.scheduled_start &&
        item.scheduled_start.startsWith(today) &&
        (
          item.channel_id === dnrt2Channel?.channel_id ||
          item.channel_code === dnrt2Channel?.code
        )
    )
    .sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start));
    
  const stats = [
    { key: "activeContracts", label: "Hợp đồng đang thực hiện", value: activeContracts.length, icon: FileText },
    { key: "upcomingPayments", label: "Thanh toán sắp đến hạn", value: upcomingPayments.length, icon: CircleDollarSign },
    { key: "overduePayments", label: "Đợt thanh toán quá hạn", value: overduePayments.length, icon: CircleDollarSign },
    { key: "pendingContents", label: "Nội dung chờ duyệt", value: pendingContents.length, icon: FolderOpen },
    { key: "waitingSchedules", label: "Lịch chờ duyệt", value: waitingSchedules.length, icon: CalendarDays },
    { key: "activeProductions", label: "Dự án sản xuất đang thực hiện", value: activeProductions.length, icon: Clapperboard },
  ] as const;
  return (
    <div>
      <SectionHeader title="Tổng quan" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.key}
              onClick={() => {
                setDetailKey(stat.key);
                if (stat.key === "activeContracts") {
                  setDetailTitle("Hợp đồng đang thực hiện");
                  setDetailContent(<div className="space-y-3">{activeContracts.map((contract) => 
                  <div key={contract.contract_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{contract.contract_number} • {contract.title}</div>
                        <div className="mt-1 text-sm text-slate-500">{contract.party_name}</div>
                        </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => {
                              setSubDetailTitle(`Chi tiết hợp đồng • ${contract.contract_number}`);
                              setSubDetailContent(
                                <ContractFullView
                                  contract={contract}
                                  serviceItems={serviceItems}
                                  bookings={bookings}
                                  paymentSchedules={paymentSchedules}
                                  payments={payments}
                                  invoices={invoices}
                                  files={files}
                                  contractFileLinks={contractFileLinks}
                                  contents={contents}
                                  productions={productions}
                                  productionTasks={productionTasks}
                                  contentFileLinks={contentFileLinks}
                                  serviceItemContents={serviceItemContents}
                                  productionFileLinks={productionFileLinks}
                                  serviceItemProductions={serviceItemProductions}
                                  channels={channels}
                                />
                              );
                              setSubDetailOpen(true);
                            }}
                          >
                            Xem chi tiết
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>);
                }

                if (stat.key === "upcomingPayments") {
                  setDetailTitle("Thanh toán sắp đến hạn");
                  setDetailContent(
                    <div className="space-y-3">
                      {upcomingPayments.map((row) => {
                        const contract = contracts.find((item) => item.contract_id === row.contract_id)!;

                        return (
                          <div key={row.payment_schedule_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="font-medium">
                                  {row.contract_number} • Đợt {row.installment_no}
                                </div>
                                <div className="mt-1 text-sm text-slate-500">
                                  Hạn: {formatDisplayDate(row.due_date)} • {formatCurrency(row.planned_amount)}
                                </div>
                              </div>

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => {
                                  setSubDetailTitle(`Chi tiết hợp đồng • ${contract.contract_number}`);
                                  setSubDetailContent(
                                    <ContractFullView
                                      contract={contract}
                                      serviceItems={serviceItems}
                                      bookings={bookings}
                                      paymentSchedules={paymentSchedules}
                                      payments={payments}
                                      invoices={invoices}
                                      files={files}
                                      contractFileLinks={contractFileLinks}
                                      contents={contents}
                                      productions={productions}
                                      productionTasks={productionTasks}
                                      contentFileLinks={contentFileLinks}
                                      serviceItemContents={serviceItemContents}
                                      productionFileLinks={productionFileLinks}
                                      serviceItemProductions={serviceItemProductions}
                                      channels={channels}
                                    />
                                  );
                                  setSubDetailOpen(true);
                                }}
                              >
                                Xem chi tiết
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                if (stat.key === "overduePayments") {
                  setDetailTitle("Thanh toán quá hạn");
                  setDetailContent(
                    <div className="space-y-3">
                      {overduePayments.map((row) => {
                        const contract = contracts.find((item) => item.contract_id === row.contract_id)!;

                        return (
                          <div key={row.payment_schedule_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="font-medium">
                                  {row.contract_number} • Đợt {row.installment_no}
                                </div>
                                <div className="mt-1 text-sm text-slate-500">
                                  Hạn: {formatDisplayDate(row.due_date)} • {formatCurrency(row.planned_amount)}
                                </div>
                              </div>

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => {
                                  setSubDetailTitle(`Chi tiết hợp đồng • ${contract.contract_number}`);
                                  setSubDetailContent(
                                    <ContractFullView
                                      contract={contract}
                                      serviceItems={serviceItems}
                                      bookings={bookings}
                                      paymentSchedules={paymentSchedules}
                                      payments={payments}
                                      invoices={invoices}
                                      files={files}
                                      contractFileLinks={contractFileLinks}
                                      contents={contents}
                                      productions={productions}
                                      productionTasks={productionTasks}
                                      contentFileLinks={contentFileLinks}
                                      serviceItemContents={serviceItemContents}
                                      productionFileLinks={productionFileLinks}
                                      serviceItemProductions={serviceItemProductions}
                                      channels={channels}
                                    />
                                  );
                                  setSubDetailOpen(true);
                                }}
                              >
                                Xem chi tiết
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                if (stat.key === "pendingContents") {
                  setDetailTitle("Content chờ duyệt");
                  setDetailContent(
                    <div className="space-y-3">
                      {pendingContents.map((content) => (
                        <div key={content.content_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-medium">{content.title}</div>
                              <div className="mt-1 text-sm text-slate-500">
                                {content.type} • {statusLabel(content.status)}
                              </div>
                            </div>

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => {
                                setSubDetailTitle(`Chi tiết content • ${content.title}`);
                                setSubDetailContent(
                                  <ContentFullView
                                    content={content}
                                    contracts={contracts}
                                    serviceItems={serviceItems}
                                    serviceItemContents={serviceItemContents}
                                    files={files}
                                    contentFileLinks={contentFileLinks}
                                  />
                                );
                                setSubDetailOpen(true);
                              }}
                            >
                              Xem chi tiết
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }

                if (stat.key === "waitingSchedules") {
                  setDetailTitle("Lịch chờ duyệt");
                  setDetailContent(
                    <div className="space-y-3">
                      {waitingSchedules.map((schedule) => (
                        <div key={schedule.broadcast_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-medium">{schedule.program_name || schedule.content_title || "—"}</div>
                              <div className="mt-1 text-sm text-slate-500">
                                {formatScheduleDateTime(schedule.scheduled_start)} • {getChannelDisplayName(channels, {
                                  channelId: schedule.channel_id,
                                  channelCode: schedule.channel_code,
                                })}
                              </div>
                            </div>

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => {
                                setSubDetailTitle(`Chi tiết lịch phát • ${schedule.program_name || schedule.content_title || "—"}`);
                                setSubDetailContent(
                                  <ScheduleFullView
                                    currentUser={currentUser}
                                    schedule={schedule}
                                    bookings={bookings}
                                    contents={contents}
                                    serviceItems={serviceItems}
                                    serviceItemContents={serviceItemContents}
                                    contracts={contracts}
                                    channels={channels}
                                    files={files}
                                    contentFileLinks={contentFileLinks}
                                  />
                                );
                                setSubDetailOpen(true);
                              }}
                            >
                              Xem chi tiết
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }

                if (stat.key === "activeProductions") {
                  setDetailTitle("Dự án sản xuất đang thực hiện");
                  setDetailContent(
                    <div className="space-y-3">
                      {activeProductions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed p-4 text-sm text-slate-500">
                          Không có dự án sản xuất nào đang thực hiện.
                        </div>
                      ) : (
                        activeProductions.map((production) => (
                          <div
                            key={production.production_id}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="font-medium">{production.name}</div>
                                <div className="mt-1 text-sm text-slate-500">
                                  {production.producer_name || "—"} • {formatDisplayDate(production.start_date)} → {formatDisplayDate(production.end_date)}
                                </div>
                              </div>

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => {
                                  setSubDetailTitle(`Chi tiết dự án • ${production.name}`);
                                  setSubDetailContent(
                                    <ProductionFullView
                                      production={production}
                                      contracts={contracts}
                                      serviceItems={serviceItems}
                                      productionTasks={productionTasks}
                                      files={files}
                                      productionFileLinks={productionFileLinks}
                                      serviceItemProductions={serviceItemProductions}
                                    />
                                  );
                                  setSubDetailOpen(true);
                                }}
                              >
                                Xem chi tiết
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  );
                }
              }}
              className="group text-left"
            >
              <Card className="overflow-hidden rounded-[24px] border border-orange-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="text-base font-semibold leading-snug text-slate-700 transition-colors group-hover:text-orange-700">
                        {stat.label}
                      </div>

                      <div className="text-4xl font-bold tracking-tight text-slate-900">
                        {stat.value}
                      </div>
                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 ring-1 ring-orange-100">
                      <Icon className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
      <div className="mt-6">
        <Card className="rounded-[24px] border border-orange-100 bg-white shadow-sm">
          <CardHeader className="border-b border-orange-100 bg-orange-50/40">
            <CardTitle className="text-xl font-bold text-slate-900">
              Lịch phát sóng hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tvChannelFilter} onValueChange={(v) => setTvChannelFilter(v as "DNRT1" | "DNRT2")}>
              <TabsList className="mb-4 grid w-full max-w-xs grid-cols-2">
                <TabsTrigger value="DNRT1">DNRT1</TabsTrigger>
                <TabsTrigger value="DNRT2">DNRT2</TabsTrigger>
              </TabsList>

              <TabsContent value="DNRT1" className="space-y-3">
                {todayDnrt1Schedules.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">
                    Không có lịch phát cho DNRT1 trong hôm nay.
                  </div>
                ) : (
                  todayDnrt1Schedules.map((item) => (
                    <div
                      key={item.broadcast_id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium">{item.program_name || item.content_title || "—"}</div>
                          <div className="mt-1 text-sm text-slate-500">
                            {formatScheduleTimeRange(item.scheduled_start, item.scheduled_end)}
                          </div>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => {
                            setSubDetailTitle(`Chi tiết lịch phát • ${item.program_name || item.content_title || "—"}`);
                            setSubDetailContent(
                              <ScheduleFullView
                                currentUser={currentUser}
                                schedule={item}
                                bookings={bookings}
                                contents={contents}
                                serviceItems={serviceItems}
                                serviceItemContents={serviceItemContents}
                                contracts={contracts}
                                channels={channels}
                                files={files}
                                contentFileLinks={contentFileLinks}
                              />
                            );
                            setSubDetailOpen(true);
                          }}
                        >
                          Xem chi tiết
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="DNRT2" className="space-y-3">
                {todayDnrt2Schedules.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">
                    Không có lịch phát cho DNRT2 trong hôm nay.
                  </div>
                ) : (
                  todayDnrt2Schedules.map((item) => (
                    <div
                      key={item.broadcast_id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium">{item.program_name || item.content_title || "—"}</div>
                          <div className="mt-1 text-sm text-slate-500">
                            {formatScheduleTimeRange(item.scheduled_start, item.scheduled_end)}
                          </div>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => {
                            setSubDetailTitle(`Chi tiết lịch phát • ${item.program_name || item.content_title || "—"}`);
                            setSubDetailContent(
                              <ScheduleFullView
                                currentUser={currentUser}
                                schedule={item}
                                bookings={bookings}
                                contents={contents}
                                serviceItems={serviceItems}
                                serviceItemContents={serviceItemContents}
                                contracts={contracts}
                                channels={channels}
                                files={files}
                                contentFileLinks={contentFileLinks}
                              />
                            );
                            setSubDetailOpen(true);
                          }}
                        >
                          Xem chi tiết
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <DetailDrawer
        title={detailTitle}
        open={detailKey !== null}
        onClose={() => {
          setDetailKey(null);
          setDetailTitle("");
          setDetailContent(null);
        }}
      >
        {detailContent}
      </DetailDrawer>

      <DetailDrawer
        title={subDetailTitle}
        open={subDetailOpen}
        onClose={() => {
          setSubDetailOpen(false);
          setSubDetailTitle("");
          setSubDetailContent(null);
        }}
      >
        {subDetailContent}
      </DetailDrawer>
    </div>
  );
}