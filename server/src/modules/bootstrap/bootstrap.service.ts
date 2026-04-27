import { pool } from "../../db/pool";

export async function getBootstrapData() {
const [
  employees,
  parties,
  channels,
  studios,
  studioRentals,
  studioUsageSchedules,
  files,
  contracts,
  serviceItems,
  bookings,
  paymentSchedules,
  payments,
  invoices,
  productionTasks,
  productions,
  contents,
  schedules,
  contractFileLinks,
  productionFileLinks,
  contentFileLinks,
  serviceItemContents,
  serviceItemProductions,
] = await Promise.all([
    pool.query(`
      select
        employee_id,
        employee_code,
        employee_name as name,
        gender,
        department,
        position,
        phone_number,
        email,
        address,
        status
      from "Employees"
      order by employee_name asc
    `),

    pool.query(`
      select
        party_id,
        party_type,
        name,
        customer_type,
        company,
        phone_number,
        email,
        address,
        account_number,
        bank,
        tax_code,
        notes
      from "Parties"
      order by name asc
    `),

    pool.query(`
      select channel_id, code, name, platform, metadata
      from "Channels"
      order by code asc
    `),

    pool.query(`
      select studio_id, name, location, size, capacity, notes
      from "Studios"
      order by name asc
    `),

    pool.query(`
      select
        sr.rental_id,
        sr.service_item_id,
        si.contract_id,
        sr.studio_id,
        sr.rental_type,
        sr.rental_start,
        sr.rental_end,
        sr.notes
      from "StudioRentals" sr
      join "ServiceItems" si on si.service_item_id = sr.service_item_id
      order by sr.rental_start desc
    `),

    pool.query(`
      select
        sus.usage_schedule_id,
        sus.studio_id,
        sus.production_id,
        sus.rental_id,
        sus.usage_start,
        sus.usage_end,
        sus.status,
        sus.approved_by,
        coalesce(ea.employee_name, ua.username) as approved_by_name,
        sus.approved_at,
        sus.notes,
        coalesce(ec.employee_name, uc.username, 'Hệ thống') as created_by_name
      from "StudioUsageSchedules" sus
      left join "Users" ua on ua.user_id = sus.approved_by
      left join "Employees" ea on ea.user_id = ua.user_id
      left join "Users" uc on uc.user_id = sus.created_by
      left join "Employees" ec on ec.user_id = uc.user_id
      order by sus.usage_start desc
    `),

    pool.query(`
      select
        f.file_id,
        f.file_name,
        f.storage_path,
        f.file_extension,
        f.file_size,
        f.folder,
        coalesce(e.employee_name, u.username, 'Hệ thống') as uploaded_by_name,
        f.uploaded_at,
        f.notes
      from "Files" f
      left join "Users" u on u.user_id = f.uploaded_by
      left join "Employees" e on e.user_id = u.user_id
      order by f.uploaded_at desc
    `),

    pool.query(`
      select
        c.contract_id,
        c.contract_number,
        c.title,
        c.party_id,
        p.name as party_name,
        c.contract_type,
        c.signed_date,
        c.start_date,
        c.end_date,
        c.total_value,
        c.status,
        coalesce(e.employee_name, u.username, 'Hệ thống') as created_by_name
      from "Contracts" c
      join "Parties" p on p.party_id = c.party_id
      left join "Users" u on u.user_id = c.created_by
      left join "Employees" e on e.user_id = u.user_id
      order by c.created_at desc
    `),

    pool.query(`
      select
        si.service_item_id,
        si.contract_id,
        c.contract_number,
        si.title,
        si.service_type,
        si.cost,
        si.status,
        si.notes
      from "ServiceItems" si
      join "Contracts" c on c.contract_id = si.contract_id
      order by si.service_item_id desc
    `),

    pool.query(`
      select *
      from (
        select
          pa.printed_ads_id as booking_id,
          'PrintedAds'::text as source_table,
          pa.service_item_id,
          c.contract_number,
          si.title as service_item_title,
          si.service_type,
          concat_ws(' • ',
            ch.code,
            pa.content_type::text,
            pa.area::text,
            concat(pa.num_issues, ' kỳ')
          ) as description,
          pa.channel_id,
          ch.code as channel_code,
          pa.start_date,
          pa.end_date,
          null::text as time_slot,
          pa.notes,
          jsonb_build_object(
            'channel_code', ch.code,
            'content_type', pa.content_type,
            'area', pa.area,
            'color', pa.color,
            'start_date', pa.start_date,
            'end_date', pa.end_date,
            'num_issues', pa.num_issues,
            'notes', pa.notes
          ) as detail_data
        from "PrintedAds" pa
        join "ServiceItems" si on si.service_item_id = pa.service_item_id
        join "Contracts" c on c.contract_id = si.contract_id
        left join "Channels" ch on ch.channel_id = pa.channel_id

        union all

        select
          ea.electronic_ads_id as booking_id,
          'ElectronicAds'::text as source_table,
          ea.service_item_id,
          c.contract_number,
          si.title as service_item_title,
          si.service_type,
          concat_ws(' • ',
            ch.code,
            ea.subtype::text,
            coalesce(ea.content_type::text, 'banner')
          ) as description,
          ea.channel_id,
          ch.code as channel_code,
          ea.start_date,
          ea.end_date,
          null::text as time_slot,
          ea.notes,
          jsonb_build_object(
            'channel_code', ch.code,
            'subtype', ea.subtype,
            'content_type', ea.content_type,
            'form', ea.form,
            'quantity', ea.quantity,
            'position', ea.position,
            'has_video', ea.has_video,
            'has_link', ea.has_link,
            'start_date', ea.start_date,
            'end_date', ea.end_date,
            'notes', ea.notes
          ) as detail_data
        from "ElectronicAds" ea
        join "ServiceItems" si on si.service_item_id = ea.service_item_id
        join "Contracts" c on c.contract_id = si.contract_id
        left join "Channels" ch on ch.channel_id = ea.channel_id

        union all

        select
          ta.tv_ads_id as booking_id,
          'TelevisionAds'::text as source_table,
          ta.service_item_id,
          c.contract_number,
          si.title as service_item_title,
          si.service_type,
          concat_ws(' • ',
            ch.code,
            ta.broadcast_type::text,
            ta.program::text
          ) as description,
          ta.channel_id,
          ch.code as channel_code,
          ta.start_date,
          ta.end_date,
          case
            when ta.start_time is not null and ta.end_time is not null
              then concat(ta.start_time, ' - ', ta.end_time)
            else null
          end as time_slot,
          ta.notes,
          jsonb_build_object(
            'channel_code', ch.code,
            'broadcast_type', ta.broadcast_type,
            'insert_type', ta.insert_type,
            'program', ta.program,
            'time_point', ta.time_point,
            'start_time', ta.start_time,
            'end_time', ta.end_time,
            'start_date', ta.start_date,
            'end_date', ta.end_date,
            'num_broadcasts', ta.num_broadcasts,
            'notes', ta.notes
          ) as detail_data
        from "TelevisionAds" ta
        join "ServiceItems" si on si.service_item_id = ta.service_item_id
        join "Contracts" c on c.contract_id = si.contract_id
        left join "Channels" ch on ch.channel_id = ta.channel_id

        union all

        select
          ra.radio_ads_id as booking_id,
          'RadioAds'::text as source_table,
          ra.service_item_id,
          c.contract_number,
          si.title as service_item_title,
          si.service_type,
          concat_ws(' • ',
            ch.code,
            ra.content_type::text,
            ra.program::text
          ) as description,
          ra.channel_id,
          ch.code as channel_code,
          ra.start_date,
          ra.end_date,
          case
            when ra.start_time is not null and ra.end_time is not null
              then concat(ra.start_time, ' - ', ra.end_time)
            else null
          end as time_slot,
          ra.notes,
          jsonb_build_object(
            'channel_code', ch.code,
            'content_type', ra.content_type,
            'program', ra.program,
            'time_point', ra.time_point,
            'start_time', ra.start_time,
            'end_time', ra.end_time,
            'start_date', ra.start_date,
            'end_date', ra.end_date,
            'num_broadcasts', ra.num_broadcasts,
            'notes', ra.notes
          ) as detail_data
        from "RadioAds" ra
        join "ServiceItems" si on si.service_item_id = ra.service_item_id
        join "Contracts" c on c.contract_id = si.contract_id
        left join "Channels" ch on ch.channel_id = ra.channel_id

        union all

        select
          da.digital_ads_id as booking_id,
          'DigitalAds'::text as source_table,
          da.service_item_id,
          c.contract_number,
          si.title as service_item_title,
          si.service_type,
          concat_ws(' • ',
            ch.code,
            da.content_type::text,
            concat(coalesce(da.quantity, 0), ' lần')
          ) as description,
          da.channel_id,
          ch.code as channel_code,
          da.start_date,
          da.end_date,
          null::text as time_slot,
          da.notes,
          jsonb_build_object(
            'channel_code', ch.code,
            'content_type', da.content_type,
            'post_date', da.post_date,
            'start_date', da.start_date,
            'end_date', da.end_date,
            'quantity', da.quantity,
            'has_experiencer', da.has_experiencer,
            'notes', da.notes
          ) as detail_data
        from "DigitalAds" da
        join "ServiceItems" si on si.service_item_id = da.service_item_id
        join "Contracts" c on c.contract_id = si.contract_id
        left join "Channels" ch on ch.channel_id = da.channel_id

        union all

        select
          ps.production_service_id as booking_id,
          'ProductionServices'::text as source_table,
          ps.service_item_id,
          c.contract_number,
          si.title as service_item_title,
          si.service_type,
          concat_ws(' • ',
            ps.content_type::text,
            concat('deadline ', ps.delivery_deadline)
          ) as description,
          null::uuid as channel_id,
          null::text as channel_code,
          null::date as start_date,
          ps.delivery_deadline as end_date,
          null::text as time_slot,
          ps.notes,
          jsonb_build_object(
            'content_type', ps.content_type,
            'requirement_description', ps.requirement_description,
            'delivery_deadline', ps.delivery_deadline,
            'notes', ps.notes
          ) as detail_data
        from "ProductionServices" ps
        join "ServiceItems" si on si.service_item_id = ps.service_item_id
        join "Contracts" c on c.contract_id = si.contract_id

        union all

        select
          sr.rental_id as booking_id,
          'StudioRentals'::text as source_table,
          sr.service_item_id,
          c.contract_number,
          si.title as service_item_title,
          si.service_type,
          concat_ws(' • ',
            st.name,
            sr.rental_type::text,
            sr.rental_start::text
          ) as description,
          null::uuid as channel_id,
          null::text as channel_code,
          sr.rental_start::date as start_date,
          sr.rental_end::date as end_date,
          null::text as time_slot,
          sr.notes,
          jsonb_build_object(
            'studio_name', st.name,
            'rental_type', sr.rental_type,
            'rental_start', sr.rental_start,
            'rental_end', sr.rental_end,
            'notes', sr.notes
          ) as detail_data
        from "StudioRentals" sr
        join "ServiceItems" si on si.service_item_id = sr.service_item_id
        join "Contracts" c on c.contract_id = si.contract_id
        left join "Studios" st on st.studio_id = sr.studio_id
      ) booking_union
      order by contract_number desc, service_item_title asc
    `),

    pool.query(`
      select
        ps.payment_schedule_id,
        ps.contract_id,
        c.contract_number,
        ps.installment_no,
        ps.due_date,
        ps.planned_amount,
        ps.status,
        ps.notes
      from "PaymentSchedules" ps
      join "Contracts" c on c.contract_id = ps.contract_id
      order by ps.due_date asc
    `),

    pool.query(`
      select
        p.payment_id,
        p.payment_schedule_id,
        c.contract_number,
        p.paid_date,
        p.amount,
        p.method,
        coalesce(e.employee_name, u.username, 'Hệ thống') as created_by_name
      from "Payments" p
      join "PaymentSchedules" ps on ps.payment_schedule_id = p.payment_schedule_id
      join "Contracts" c on c.contract_id = ps.contract_id
      left join "Users" u on u.user_id = p.created_by
      left join "Employees" e on e.user_id = u.user_id
      order by p.paid_date desc
    `),

    pool.query(`
      select
        i.invoice_id,
        i.invoice_number,
        i.contract_id,
        c.contract_number,
        i.issue_date,
        i.total_amount,
        i.status,
        coalesce(e.employee_name, u.username, 'Hệ thống') as created_by_name
      from "Invoices" i
      join "Contracts" c on c.contract_id = i.contract_id
      left join "Users" u on u.user_id = i.created_by
      left join "Employees" e on e.user_id = u.user_id
      order by i.created_at desc
    `),

    pool.query(`
      select
        pt.production_task_id as task_id,
        pt.production_id,
        pt.employee_id,
        e.employee_code,
        e.employee_name,
        e.department,
        pt.role as role_label
      from "ProductionTasks" pt
      join "Employees" e on e.employee_id = pt.employee_id
    `),

    pool.query(`
      select
        p.production_id,
        null::uuid as service_item_id,
        null::uuid as contract_id,
        p.name,
        p.type,
        p.genre,
        p.duration_minutes,
        to_char(p.start_date, 'YYYY-MM-DD') as start_date,
        case
          when p.end_date is not null then to_char(p.end_date, 'YYYY-MM-DD')
          else null
        end as end_date,
        p.producer,
        ep.employee_name as producer_name,
        p.status,
        p.notes,
        coalesce(ec.employee_name, uc.username, 'Hệ thống') as created_by_name,
        coalesce(
          (
            select array_agg(pf.file_id order by pf.production_file_id)
            from "ProductionFiles" pf
            where pf.production_id = p.production_id
          ),
          ARRAY[]::uuid[]
        ) as file_ids
      from "Productions" p
      left join "Employees" ep on ep.employee_id = p.producer
      left join "Users" uc on uc.user_id = p.created_by
      left join "Employees" ec on ec.user_id = uc.user_id
      order by p.created_at desc
    `),

    pool.query(`
      select
        c.content_id,
        c.title,
        c.type,
        c.source,
        c.status,
        c.approved_by,
        coalesce(ea.employee_name, ua.username) as approved_by_name,
        c.approved_at,
        coalesce(ec.employee_name, uc.username, 'Hệ thống') as created_by_name,
        (
          select si.title
          from "ServiceItemContents" sic
          join "ServiceItems" si on si.service_item_id = sic.service_item_id
          where sic.content_id = c.content_id
          order by sic.service_item_content_id asc
          limit 1
        ) as linked_service_label,
        c.notes
      from "Contents" c
      left join "Users" ua on ua.user_id = c.approved_by
      left join "Employees" ea on ea.user_id = ua.user_id
      left join "Users" uc on uc.user_id = c.created_by
      left join "Employees" ec on ec.user_id = uc.user_id
      order by c.created_at desc
    `),

    pool.query(`
      select
        bs.broadcast_id,
        bs.program_name,
        bs.schedule_type,
        bs.schedule_mode,
        bs.service_item_id,
        bs.booking_id,
        bs.channel_id,
        ch.code as channel_code,
        bs.content_id,
        cnt.title as content_title,
        bs.scheduled_start,
        bs.scheduled_end,
        bs.status,
        bs.approved_by,
        coalesce(ea.employee_name, ua.username) as approved_by_name,
        bs.approved_at,
        coalesce(ec.employee_name, uc.username, 'Hệ thống') as created_by_name,
        ct.contract_number,
        bs.notes
      from "BroadcastSchedules" bs
      left join "Channels" ch on ch.channel_id = bs.channel_id
      left join "Contents" cnt on cnt.content_id = bs.content_id
      left join "ServiceItems" si on si.service_item_id = bs.service_item_id
      left join "Contracts" ct on ct.contract_id = si.contract_id
      left join "Users" ua on ua.user_id = bs.approved_by
      left join "Employees" ea on ea.user_id = ua.user_id
      left join "Users" uc on uc.user_id = bs.created_by
      left join "Employees" ec on ec.user_id = uc.user_id
      order by bs.scheduled_start desc
    `),

    pool.query(`
      select contract_file_id as id, contract_id as parent_id, file_id, file_role, is_main, notes
      from "ContractFiles"
    `),

    pool.query(`
      select production_file_id as id, production_id as parent_id, file_id, file_role, is_main, notes
      from "ProductionFiles"
    `),

    pool.query(`
      select content_file_id as id, content_id as parent_id, file_id, file_role, is_main, notes
      from "ContentFiles"
    `),

    pool.query(`
      select service_item_content_id, service_item_id, content_id, notes
      from "ServiceItemContents"
    `),

    pool.query(`
      select service_production_id, service_item_id, production_id, notes
      from "ServiceItemProductions"
    `),
  ]);

  return {
    sessionUser: null,
    employees: employees.rows,
    parties: parties.rows,
    channels: channels.rows,
    studios: studios.rows,
    studioRentals: studioRentals.rows,
    studioUsageSchedules: studioUsageSchedules.rows,
    files: files.rows,
    contracts: contracts.rows,
    serviceItems: serviceItems.rows,
    bookings: bookings.rows,
    paymentSchedules: paymentSchedules.rows,
    payments: payments.rows,
    invoices: invoices.rows,
    productionTasks: productionTasks.rows,
    productions: productions.rows,
    contents: contents.rows,
    schedules: schedules.rows,
    contractFileLinks: contractFileLinks.rows,
    productionFileLinks: productionFileLinks.rows,
    contentFileLinks: contentFileLinks.rows,
    serviceItemContents: serviceItemContents.rows,
    serviceItemProductions: serviceItemProductions.rows,
  };
}