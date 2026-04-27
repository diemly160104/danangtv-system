import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type {
  ContentType,
  ContentSource,
  SessionUser,
  FileRow,
  ContractRow,
  ServiceItemRow,
  ContentRow,
  ContentForm,
  ContentFormDialogProps,
  DraftLinkedFile,
  LinkedFileSeedRow,
  ContentSavePayload,
  ServiceItemContentRow,
  DraftContentServiceLink,
} from "@/features/danangtv/types";

import {
  buildDraftContentFiles,
  buildContentFormData
} from "@/features/danangtv/selectors";

import {
  contentTypeOptions,
  contentSourceOptions,
  contentStatusOptions
} from "@/features/danangtv/options";

import {
  StatusBadge,
  PrimaryButton,
  TruncatedHoverText,
  LinkedFilesViewer,
  SuggestionList,
  FormSection,
  SectionHeader,
  DetailSectionTitle,
  DetailDrawer,
  FieldBlock,
  EnumSelect,
  ActionDropdown,
} from "@/features/danangtv/shared/commonComponents";

import {
  canApprove,
  canCreateOperationalRecord,
  canDeleteOwnOperationalRecord,
  canEditOwnOperationalRecord,
  statusLabel,
  formatScheduleDateTime,
  isBlank,
  optionLabel,
  searchWithMinChars,
  serviceTypeLabel,
  validateLinkedFilesBySchema,
  createId,
} from "@/features/danangtv/utils/Helpers";

import { LinkedFilesEditor } from "@/features/danangtv/shared/LinkedFilesEditor";


// HÀM TẠO MỘT DÒNG LIÊN KẾT DỊCH VỤ TRỐNG TRONG FORM CONTENT
function createEmptyContentServiceLink(): DraftContentServiceLink {
  return {
    id: createId("CSL"),
    contract_search: "",
    selected_contract_id: "",
    selected_service_item_id: "",
  };
}

// HÀM TẠO FORM TRỐNG CHO CONTENT
function createEmptyContentForm(): ContentForm {
  return {
    title: "",
    type: "video",
    source: "customer_provided",
    status: "draft",
    service_links: [createEmptyContentServiceLink()],
    selected_file_ids: [],
    notes: "",
    file_search: "",
    folder_filter: "all",
  };
}

// HÀM KIỂM TRA FORM CONTENT TRƯỚC KHI LƯU
function validateContentBeforeSave(args: {
  form: ContentForm;
  linkedFiles: DraftLinkedFile[];
}) {
  const { form, linkedFiles } = args;

  if (isBlank(form.title)) return "Vui lòng nhập tên content.";
  if (isBlank(form.type)) return "Vui lòng chọn loại content.";
  if (isBlank(form.source)) return "Vui lòng chọn nguồn content.";
  if (isBlank(form.status)) return "Vui lòng chọn trạng thái content.";

  const contentFileError = validateLinkedFilesBySchema(linkedFiles, {
    entityLabel: "Content",
    requireRole: true,
  });
  if (contentFileError) return contentFileError;

  for (let i = 0; i < form.service_links.length; i++) {
    const row = form.service_links[i];

    const hasContract = !isBlank(row.selected_contract_id);
    const hasService = !isBlank(row.selected_service_item_id);
    const hasSearch = !isBlank(row.contract_search);

    if (!hasContract && !hasService && !hasSearch) continue;

    if (hasContract && !hasService) {
      return `Liên kết dịch vụ ${i + 1}: bạn đã chọn hợp đồng nhưng chưa chọn mục dịch vụ.`;
    }

    if (!hasContract && hasService) {
      return `Liên kết dịch vụ ${i + 1}: mục dịch vụ phải thuộc một hợp đồng đã chọn.`;
    }
  }

  return null;
}

// HÀM HIỂN THỊ TOÀN BỘ THÔNG TIN CỦA CONTENT
export function ContentFullView({
  content,
  contracts,
  serviceItems,
  serviceItemContents,
  files,
  contentFileLinks,
}: {
  content: ContentRow;
  contracts: ContractRow[];
  serviceItems: ServiceItemRow[];
  serviceItemContents: ServiceItemContentRow[];
  files: FileRow[];
  contentFileLinks: LinkedFileSeedRow[];
}) {
  const linkedContentRows = serviceItemContents.filter(
    (row) => row.content_id === content.content_id
  );

  const linkedServices = linkedContentRows
    .map((row) =>
      serviceItems.find((item) => item.service_item_id === row.service_item_id)
    )
    .filter(Boolean) as ServiceItemRow[];

  const linkedContractGroups = contracts
    .map((contract) => {
      const servicesOfContract = linkedServices.filter(
        (service) => service.contract_id === contract.contract_id
      );

      return {
        contract,
        services: servicesOfContract,
      };
    })
    .filter((group) => group.services.length > 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <DetailSectionTitle>Thông tin chung</DetailSectionTitle>
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div><span className="font-medium">Tên content:</span> {content.title}</div>
          <div><span className="font-medium">Loại:</span> {optionLabel(contentTypeOptions, content.type)}</div>
          <div><span className="font-medium">Nguồn:</span> {optionLabel(contentSourceOptions, content.source)}</div>
          <div><span className="font-medium">Trạng thái:</span> {statusLabel(content.status)}</div>
          <div><span className="font-medium">Người tạo:</span> {content.created_by_name}</div>
          <div><span className="font-medium">Người duyệt:</span> {content.approved_by_name || "—"}</div>
          <div>
            <span className="font-medium">Thời gian duyệt:</span>{" "}
            {content.approved_at ? formatScheduleDateTime(content.approved_at) : "—"}
          </div>
          <div className="md:col-span-2">
            <span className="font-medium">Hợp đồng / mục dịch vụ:</span>
            {linkedContractGroups.length > 0 ? (
              <div className="mt-2 space-y-2">
                {linkedContractGroups.map((group) => (
                  <div
                    key={group.contract.contract_id}
                    className="rounded-xl border bg-slate-50 px-3 py-2"
                  >
                    <div className="font-medium text-slate-800">
                      {group.contract.contract_number} • {group.contract.title}
                    </div>
                    <div className="mt-1 text-slate-600">
                      {group.services.map((service) => service.title).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span> —</span>
            )}
          </div>
          <div className="md:col-span-2">
            <span className="font-medium">Ghi chú:</span> {(content as any).notes || "—"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <DetailSectionTitle>File của content</DetailSectionTitle>
        <LinkedFilesViewer
          rows={buildDraftContentFiles(
            files,
            contentFileLinks,
            content.content_id,
            content.file_ids
          )}
        />
      </div>
    </div>
  );
}

// HÀM FORM DIALOG DÙNG CHO CẢ TẠO MỚI VÀ CHỈNH SỬA CONTENT
export function ContentFormDialog({
  open,
  onOpenChange,
  mode,
  initialContent,
  contracts,
  serviceItems,
  files,
  contentFileLinks,
  serviceItemContents,
  onSaveContent,
}: ContentFormDialogProps & {
  contracts: ContractRow[];
  serviceItems: ServiceItemRow[];
  files: FileRow[];
  contentFileLinks: LinkedFileSeedRow[];
  serviceItemContents: ServiceItemContentRow[];
  onSaveContent: (payload: ContentSavePayload) => Promise<boolean>;
}) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState<ContentForm>(createEmptyContentForm());
  const [linkedFiles, setLinkedFiles] = useState<DraftLinkedFile[]>([]);

  useEffect(() => {
    if (!open) return;

    if (!isEdit || !initialContent) {
      setForm(createEmptyContentForm());
      setLinkedFiles([]);
      return;
    }

    setForm(
      buildContentFormData(
        contracts,
        serviceItems,
        serviceItemContents,
        initialContent
      )
    );

    setLinkedFiles(
      buildDraftContentFiles(
        files,
        contentFileLinks,
        initialContent.content_id,
        initialContent.file_ids
      )
    );
  }, [
    open,
    isEdit,
    initialContent,
    contracts,
    serviceItems,
    serviceItemContents,
    files,
    contentFileLinks,
  ]);

  const addServiceLink = () => {
    setForm((prev) => ({
      ...prev,
      service_links: [...prev.service_links, createEmptyContentServiceLink()],
    }));
  };

  const removeServiceLink = (linkId: string) => {
    setForm((prev) => ({
      ...prev,
      service_links:
        prev.service_links.length > 1
          ? prev.service_links.filter((item) => item.id !== linkId)
          : [createEmptyContentServiceLink()],
    }));
  };

  const updateServiceLink = (
    linkId: string,
    key: keyof DraftContentServiceLink,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      service_links: prev.service_links.map((item) =>
        item.id === linkId
          ? {
              ...item,
              [key]: value,
              ...(key === "contract_search"
                ? {
                    selected_contract_id: "",
                    selected_service_item_id: "",
                  }
                : key === "selected_contract_id"
                ? {
                    selected_service_item_id: "",
                  }
                : {}),
            }
          : item
      ),
    }));
  };

  const handleSave = async () => {
    const validationError = validateContentBeforeSave({
      form,
      linkedFiles,
    });

    if (validationError) {
      alert(validationError);
      return;
    }

    const payload: ContentSavePayload = {
      content: {
        content_id: isEdit ? initialContent?.content_id : undefined,
        title: form.title,
        type: form.type,
        source: form.source,
        status: form.status,
        notes: form.notes,
      },
      service_item_ids: Array.from(
        new Set(
          form.service_links
            .map((item) => item.selected_service_item_id)
            .filter(Boolean)
        )
      ),
      content_files: linkedFiles.map((row) => ({
        file_id: row.file_id || null,
        file_role: row.file_role,
        is_main: row.is_main,
        notes: row.notes,
      })),
    };

    const saved = await onSaveContent(payload);
    if (!saved) return;
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-auto rounded-2xl sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa content" : "Tạo content mới"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <FormSection title="Thông tin content">
            <div className="grid gap-4 md:grid-cols-3">
              <FieldBlock label="Tên content">
                <Input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </FieldBlock>

              <FieldBlock label="Loại content">
                <EnumSelect
                  value={form.type}
                  onChange={(v) => setForm((prev) => ({ ...prev, type: v }))}
                  options={contentTypeOptions}
                />
              </FieldBlock>

              <FieldBlock label="Nguồn content">
                <EnumSelect
                  value={form.source}
                  onChange={(v) => setForm((prev) => ({ ...prev, source: v }))}
                  options={contentSourceOptions}
                />
              </FieldBlock>

              <FieldBlock label="Trạng thái">
                <EnumSelect
                  value={form.status}
                  onChange={(v) => setForm((prev) => ({ ...prev, status: v }))}
                  options={contentStatusOptions}
                />
              </FieldBlock>

              <div className="md:col-span-2">
                <FieldBlock label="Ghi chú">
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </FieldBlock>
              </div>
            </div>
          </FormSection>

          <FormSection title="Dịch vụ sử dụng content">
            <div className="space-y-4">
              {form.service_links.map((link, index) => {
                const contractSuggestions = searchWithMinChars(
                  contracts.filter((item) => item.contract_type === "service"),
                  link.contract_search,
                  (item) => `${item.contract_number} ${item.title} ${item.party_name}`
                );

                const selectedContract =
                  contracts.find((item) => item.contract_id === link.selected_contract_id) || null;

                const serviceOptions = serviceItems.filter(
                  (item) => item.contract_id === link.selected_contract_id
                );

                const selectedService =
                  serviceItems.find((item) => item.service_item_id === link.selected_service_item_id) || null;

                return (
                  <div key={link.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="font-medium text-slate-800">Mục dịch vụ {index + 1}</div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => removeServiceLink(link.id)}
                      >
                        Xóa
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FieldBlock label="Tìm hợp đồng">
                        <div className="space-y-2">
                          <Input
                            value={link.contract_search}
                            onChange={(e) =>
                              updateServiceLink(link.id, "contract_search", e.target.value)
                            }
                            placeholder="Nhập số hoặc tên hợp đồng..."
                          />

                          {link.contract_search.trim().length >= 2 && !link.selected_contract_id && (
                            <SuggestionList
                              items={contractSuggestions.map(
                                (item) => `${item.contract_number} • ${item.title}`
                              )}
                              onPick={(value) => {
                                const picked = contractSuggestions.find(
                                  (item) => `${item.contract_number} • ${item.title}` === value
                                );

                                if (picked) {
                                  setForm((prev) => ({
                                    ...prev,
                                    service_links: prev.service_links.map((item) =>
                                      item.id === link.id
                                        ? {
                                            ...item,
                                            selected_contract_id: picked.contract_id,
                                            selected_service_item_id: "",
                                            contract_search: `${picked.contract_number} • ${picked.title}`,
                                          }
                                        : item
                                    ),
                                  }));
                                }
                              }}
                            />
                          )}

                          {selectedContract && (
                            <div className="text-xs text-emerald-600">
                              Đã chọn: {selectedContract.contract_number} • {selectedContract.title}
                            </div>
                          )}
                        </div>
                      </FieldBlock>

                      <FieldBlock label="Mục dịch vụ của hợp đồng">
                        <div className="space-y-2">
                          <Select
                            value={link.selected_service_item_id}
                            onValueChange={(value) =>
                              updateServiceLink(link.id, "selected_service_item_id", value)
                            }
                          >
                            <SelectTrigger className="rounded-2xl">
                              <SelectValue placeholder="Chọn mục dịch vụ" />
                            </SelectTrigger>
                            <SelectContent>
                              {serviceOptions.map((item) => (
                                <SelectItem key={item.service_item_id} value={item.service_item_id}>
                                  {item.title} • {serviceTypeLabel(item.service_type)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {selectedService && (
                            <div className="text-xs text-emerald-600">
                              Đã chọn mục dịch vụ: {selectedService.title}
                            </div>
                          )}
                        </div>
                      </FieldBlock>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-orange-200 bg-white hover:bg-orange-50"
                  onClick={addServiceLink}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm mục dịch vụ
                </Button>
              </div>
            </div>
          </FormSection>

          <FormSection title="File của content">
            <LinkedFilesEditor
              mode="repository"
              rows={linkedFiles}
              setRows={setLinkedFiles}
              files={files}
            />
          </FormSection>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-2xl" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <PrimaryButton onClick={handleSave}>
            {isEdit ? "Lưu thay đổi" : "Lưu content"}
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// HÀM TRANG DANH SÁCH VÀ CÁC CHỨC NĂNG LIÊN QUAN ĐẾN CONTENT
export function ContentsPage({
  currentUser,
  contents,
  contracts,
  serviceItems,
  files,
  contentFileLinks,
  serviceItemContents,
  onSaveContent,
  onApproveContent,
  onDeleteContent,
}: {
  currentUser: SessionUser;
  contents: ContentRow[];
  contracts: ContractRow[];
  serviceItems: ServiceItemRow[];
  files: FileRow[];
  contentFileLinks: LinkedFileSeedRow[];
  serviceItemContents: ServiceItemContentRow[];
  onSaveContent: (payload: ContentSavePayload) => Promise<boolean>;
  onApproveContent: (contentId: string, approver: SessionUser) => void;
  onDeleteContent: (contentId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [contentTypeFilter, setContentTypeFilter] = useState<"all" | ContentType>("all");
  const [contentSourceFilter, setContentSourceFilter] = useState<"all" | ContentSource>("all");
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  const getContentServiceTitle = (content: ContentRow) => {
    const links = serviceItemContents.filter((row) => row.content_id === content.content_id);

    if (links.length === 0) return "—";

    const titles = links
      .map((row) => serviceItems.find((service) => service.service_item_id === row.service_item_id)?.title)
      .filter(Boolean);

    return titles.length > 0 ? titles.join(", ") : "—";
  };

  const filteredContents = useMemo(() => {
    return contents.filter((item) => {
      const joined = [
        item.title,
        getContentServiceTitle(item),
        item.created_by_name,
      ]
        .join(" ")
        .toLowerCase();

      const matchSearch = joined.includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" ? true : item.status === statusFilter;
      const matchType =
        contentTypeFilter === "all" ? true : item.type === contentTypeFilter;
      const matchSource =
        contentSourceFilter === "all"
          ? true
          : item.source === contentSourceFilter;

      return matchSearch && matchStatus && matchType && matchSource;
    });
  }, [
    contents,
    search,
    statusFilter,
    contentTypeFilter,
    contentSourceFilter,
    serviceItemContents,
    serviceItems,
  ]);

  const selectedContent =
    contents.find((item) => item.content_id === selectedContentId) || null;


  return (
    <div>
      <SectionHeader
        title="Content"
        actions={
          canCreateOperationalRecord(currentUser) ? (
            <PrimaryButton
              onClick={() => {
                setSelectedContentId(null);
                setFormMode("create");
                setFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm content
            </PrimaryButton>
          ) : null
        }
      />

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4">
          <div className="mb-4">
            <div className="grid w-full grid-cols-[minmax(0,1fr)_180px_180px_180px] gap-3">
              <div className="relative min-w-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên content hoặc dịch vụ liên quan..."
                  className="pl-9 rounded-2xl"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full rounded-2xl">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {contentStatusOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={contentTypeFilter}
                onValueChange={(value) =>
                  setContentTypeFilter(value as "all" | ContentType)
                }
              >
                <SelectTrigger className="w-full rounded-2xl">
                  <SelectValue placeholder="Loại content" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  {contentTypeOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={contentSourceFilter}
                onValueChange={(value) =>
                  setContentSourceFilter(value as "all" | ContentSource)
                }
              >
                <SelectTrigger className="w-full rounded-2xl">
                  <SelectValue placeholder="Nguồn content" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả nguồn</SelectItem>
                  {contentSourceOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[240px]">Tên nội dung</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Nguồn</TableHead>
                <TableHead>Người duyệt</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredContents.map((item) => {
                const canEditItem = canEditOwnOperationalRecord({
                  user: currentUser,
                  createdByName: item.created_by_name,
                  status: item.status,
                });

                const canDeleteItem = canDeleteOwnOperationalRecord({
                  user: currentUser,
                  createdByName: item.created_by_name,
                  status: item.status,
                });

                return (
                <TableRow key={item.content_id}>
                  <TableCell className="max-w-0 font-medium">
                    <TruncatedHoverText text={item.title} widthClass="max-w-[240px]" />
                  </TableCell>
                  <TableCell>{optionLabel(contentTypeOptions, item.type)}</TableCell>
                  <TableCell>{optionLabel(contentSourceOptions, item.source)}</TableCell>
                  <TableCell>{item.approved_by_name || "—"}</TableCell>
                  <TableCell>
                    <StatusBadge value={item.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionDropdown
                      items={[
                        { value: "detail", label: "Xem chi tiết" },
                        ...(canEditItem ? [{ value: "edit", label: "Chỉnh sửa" }] : []),
                        ...(canApprove(currentUser) && item.status !== "approved"
                          ? [{ value: "approve", label: "Duyệt" }]
                          : []),
                        ...(canDeleteItem ? [{ value: "delete", label: "Xóa" }] : []),
                      ]}
                      onAction={(action) => {
                        setSelectedContentId(item.content_id);

                        if (action === "detail") {
                          setDetailOpen(true);
                          return;
                        }

                        if (action === "edit") {
                          setFormMode("edit");
                          setFormOpen(true);
                          return;
                        }

                        if (action === "approve") {
                          onApproveContent(item.content_id, currentUser);
                          return;
                        }

                        if (action === "delete") {
                          const confirmed = window.confirm(
                            `Bạn có chắc muốn xóa content "${item.title}" không?\n\nThao tác này sẽ xóa luôn liên kết file của content này trong dữ liệu giao diện hiện tại.`
                          );

                          if (!confirmed) return;

                          setDetailOpen(false);
                          setFormOpen(false);
                          setSelectedContentId(null);

                          onDeleteContent(item.content_id);
                        }
                      }}
                    />
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DetailDrawer
        title={selectedContent ? `Chi tiết content • ${selectedContent.title}` : "Chi tiết content"}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {selectedContent && (
          <ContentFullView
            content={selectedContent}
            contracts={contracts}
            serviceItems={serviceItems}
            serviceItemContents={serviceItemContents}
            files={files}
            contentFileLinks={contentFileLinks}
          />
        )}
      </DetailDrawer>

      <ContentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialContent={selectedContent}
        contracts={contracts}
        serviceItems={serviceItems}
        files={files}
        contentFileLinks={contentFileLinks}
        serviceItemContents={serviceItemContents}
        onSaveContent={onSaveContent}
      />
    </div>
  );
}