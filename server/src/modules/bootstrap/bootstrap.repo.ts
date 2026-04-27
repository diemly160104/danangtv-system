import { pool } from "../../db/pool";

export async function getBootstrapData() {
  const [
    employeesResult,
    partiesResult,
    channelsResult,
    studiosResult,
    studioRentalsResult,
    studioUsageResult,
    filesResult,
    contractsResult,
    serviceItemsResult,
    bookingsResult,
    paymentSchedulesResult,
    paymentsResult,
    invoicesResult,
    productionTasksResult,
    productionsResult,
    contentsResult,
    schedulesResult,
    contractFileLinksResult,
    productionFileLinksResult,
    contentFileLinksResult,
    serviceItemContentsResult,
    serviceItemProductionsResult,
  ] = await Promise.all([
    pool.query(`
      SELECT
        employee_id,
        employee_code,
        employee_name AS name,
        gender,
        department,
        position,
        phone_number,
        email,
        address,
        status
      FROM "Employees"
      ORDER BY employee_name ASC
    `),

    pool.query(`
      SELECT
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
      FROM "Parties"
      ORDER BY name ASC
    `),

    pool.query(`
      SELECT
        channel_id,
        code,
        name,
        platform,
        metadata
      FROM "Channels"
      ORDER BY code ASC
    `),

    pool.query(`
      SELECT
        studio_id,
        name,
        location,
        size,
        capacity,
        notes
      FROM "Studios"
      ORDER BY name ASC
    `),

    pool.query(`
      SELECT
        sr.rental_id,
        sr.service_item_id,
        si.contract_id,
        sr.studio_id,
        sr.rental_type,
        to_char(sr.rental_start, 'YYYY-MM-DD"T"HH24:MI') AS rental_start,
        to_char(sr.rental_end, 'YYYY-MM-DD"T"HH24:MI') AS rental_end,
        sr.notes
      FROM "StudioRentals" sr
      JOIN "ServiceItems" si ON si.service_item_id = sr.service_item_id
      ORDER BY sr.rental_start DESC
    `),

    pool.query(`
      SELECT
        sus.usage_schedule_id,
        sus.studio_id,
        sus.production_id,
        sus.rental_id,
        to_char(sus.usage_start, 'YYYY-MM-DD"T"HH24:MI') AS usage_start,
        to_char(sus.usage_end, 'YYYY-MM-DD"T"HH24:MI') AS usage_end,
        sus.status,
        sus.approved_by,
        COALESCE(ea.employee_name, ua.username) AS approved_by_name,
        CASE
          WHEN sus.approved_at IS NOT NULL THEN to_char(sus.approved_at, 'YYYY-MM-DD"T"HH24:MI')
          ELSE NULL
        END AS approved_at,
        sus.notes,
        COALESCE(ec.employee_name, uc.username) AS created_by_name
      FROM "StudioUsageSchedules" sus
      JOIN "Users" uc ON uc.user_id = sus.created_by
      LEFT JOIN "Employees" ec ON ec.user_id = uc.user_id
      LEFT JOIN "Users" ua ON ua.user_id = sus.approved_by
      LEFT JOIN "Employees" ea ON ea.user_id = ua.user_id
      ORDER BY sus.usage_start DESC
    `),

    pool.query(`
      SELECT
        f.file_id,
        f.file_name,
        f.storage_path,
        f.file_extension,
        f.file_size,
        f.folder,
        COALESCE(e.employee_name, u.username) AS uploaded_by_name,
        to_char(f.uploaded_at, 'YYYY-MM-DD HH24:MI') AS uploaded_at,
        f.notes
      FROM "Files" f
      JOIN "Users" u ON u.user_id = f.uploaded_by
      LEFT JOIN "Employees" e ON e.user_id = u.user_id
      ORDER BY f.uploaded_at DESC
    `),

    pool.query(`
      SELECT
        c.contract_id,
        c.contract_number,
        c.title,
        c.party_id,
        p.name AS party_name,
        c.contract_type,
        to_char(c.signed_date, 'YYYY-MM-DD') AS signed_date,
        to_char(c.start_date, 'YYYY-MM-DD') AS start_date,
        CASE WHEN c.end_date IS NOT NULL THEN to_char(c.end_date, 'YYYY-MM-DD') ELSE NULL END AS end_date,
        c.total_value::float8 AS total_value,
        c.status,
        COALESCE(e.employee_name, u.username) AS created_by_name,
        COALESCE(
          (
            SELECT array_agg(cf.file_id ORDER BY cf.contract_file_id)
            FROM "ContractFiles" cf
            WHERE cf.contract_id = c.contract_id
          ),
          ARRAY[]::uuid[]
        ) AS file_ids
      FROM "Contracts" c
      JOIN "Parties" p ON p.party_id = c.party_id
      JOIN "Users" u ON u.user_id = c.created_by
      LEFT JOIN "Employees" e ON e.user_id = u.user_id
      ORDER BY c.created_at DESC
    `),

    pool.query(`
      SELECT
        si.service_item_id,
        si.contract_id,
        c.contract_number,
        si.title,
        si.service_type,
        si.cost::float8 AS cost,
        si.status,
        si.notes
      FROM "ServiceItems" si
      JOIN "Contracts" c ON c.contract_id = si.contract_id
      ORDER BY si.title ASC
    `),

    pool.query(`
      SELECT * FROM (
        SELECT
          pa.printed_ads_id AS booking_id,
          pa.service_item_id,
          c.contract_number,
          si.title AS service_item_title,
          si.service_type,
          CONCAT('Báo in ', ch.code) AS description,
          ch.code AS channel_code,
          to_char(pa.start_date, 'YYYY-MM-DD') AS start_date,
          to_char(pa.end_date, 'YYYY-MM-DD') AS end_date,
          NULL::text AS time_slot,
          pa.notes,
          jsonb_build_object(
            'channel_code', ch.code,
            'content_type', pa.content_type,
            'area', pa.area,
            'color', pa.color,
            'start_date', to_char(pa.start_date, 'YYYY-MM-DD'),
            'end_date', to_char(pa.end_date, 'YYYY-MM-DD'),
            'num_issues', pa.num_issues,
            'notes', pa.notes
          ) AS detail_data
        FROM "PrintedAds" pa
        JOIN "ServiceItems" si ON si.service_item_id = pa.service_item_id
        JOIN "Contracts" c ON c.contract_id = si.contract_id
        JOIN "Channels" ch ON ch.channel_id = pa.channel_id

        UNION ALL

        SELECT
          ea.electronic_ads_id AS booking_id,
          ea.service_item_id,
          c.contract_number,
          si.title AS service_item_title,
          si.service_type,
          CONCAT('Báo điện tử ', ch.code) AS description,
          ch.code AS channel_code,
          to_char(ea.start_date, 'YYYY-MM-DD') AS start_date,
          to_char(ea.end_date, 'YYYY-MM-DD') AS end_date,
          NULL::text AS time_slot,
          ea.notes,
          jsonb_build_object(
            'channel_code', ch.code,
            'subtype', ea.subtype,
            'content_type', ea.content_type,
            'form', ea.form,
            'position', ea.position,
            'quantity', ea.quantity,
            'has_video', ea.has_video,
            'has_link', ea.has_link,
            'start_date', to_char(ea.start_date, 'YYYY-MM-DD'),
            'end_date', to_char(ea.end_date, 'YYYY-MM-DD'),
            'notes', ea.notes
          ) AS detail_data
        FROM "ElectronicAds" ea
        JOIN "ServiceItems" si ON si.service_item_id = ea.service_item_id
        JOIN "Contracts" c ON c.contract_id = si.contract_id
        JOIN "Channels" ch ON ch.channel_id = ea.channel_id

        UNION ALL

        SELECT
          ta.tv_ads_id AS booking_id,
          ta.service_item_id,
          c.contract_number,
          si.title AS service_item_title,
          si.service_type,
          CONCAT('Truyền hình ', ch.code) AS description,
          ch.code AS channel_code,
          to_char(ta.start_date, 'YYYY-MM-DD') AS start_date,
          to_char(ta.end_date, 'YYYY-MM-DD') AS end_date,
          CONCAT(COALESCE(to_char(ta.start_time, 'HH24:MI'), ''), ' - ', COALESCE(to_char(ta.end_time, 'HH24:MI'), '')) AS time_slot,
          ta.notes,
          jsonb_build_object(
            'channel_code', ch.code,
            'broadcast_type', ta.broadcast_type,
            'insert_type', ta.insert_type,
            'program', ta.program,
            'time_point', ta.time_point,
            'start_time', to_char(ta.start_time, 'HH24:MI'),
            'end_time', to_char(ta.end_time, 'HH24:MI'),
            'start_date', to_char(ta.start_date, 'YYYY-MM-DD'),
            'end_date', to_char(ta.end_date, 'YYYY-MM-DD'),
            'num_broadcasts', ta.num_broadcasts,
            'notes', ta.notes
          ) AS detail_data
        FROM "TelevisionAds" ta
        JOIN "ServiceItems" si ON si.service_item_id = ta.service_item_id
        JOIN "Contracts" c ON c.contract_id = si.contract_id
        JOIN "Channels" ch ON ch.channel_id = ta.channel_id

        UNION ALL

        SELECT
          ra.radio_ads_id AS booking_id,
          ra.service_item_id,
          c.contract_number,
          si.title AS service_item_title,
          si.service_type,
          CONCAT('Phát thanh ', ch.code) AS description,
          ch.code AS channel_code,
          to_char(ra.start_date, 'YYYY-MM-DD') AS start_date,
          to_char(ra.end_date, 'YYYY-MM-DD') AS end_date,
          CONCAT(COALESCE(to_char(ra.start_time, 'HH24:MI'), ''), ' - ', COALESCE(to_char(ra.end_time, 'HH24:MI'), '')) AS time_slot,
          ra.notes,
          jsonb_build_object(
            'channel_code', ch.code,
            'content_type', ra.content_type,
            'program', ra.program,
            'time_point', ra.time_point,
            'start_time', to_char(ra.start_time, 'HH24:MI'),
            'end_time', to_char(ra.end_time, 'HH24:MI'),
            'start_date', to_char(ra.start_date, 'YYYY-MM-DD'),
            'end_date', to_char(ra.end_date, 'YYYY-MM-DD'),
            'num_broadcasts', ra.num_broadcasts,
            'notes', ra.notes
          ) AS detail_data
        FROM "RadioAds" ra
        JOIN "ServiceItems" si ON si.service_item_id = ra.service_item_id
        JOIN "Contracts" c ON c.contract_id = si.contract_id
        JOIN "Channels" ch ON ch.channel_id = ra.channel_id

        UNION ALL

        SELECT
          da.digital_ads_id AS booking_id,
          da.service_item_id,
          c.contract_number,
          si.title AS service_item_title,
          si.service_type,
          CONCAT('Digital ', ch.code) AS description,
          ch.code AS channel_code,
          to_char(da.start_date, 'YYYY-MM-DD') AS start_date,
          to_char(da.end_date, 'YYYY-MM-DD') AS end_date,
          NULL::text AS time_slot,
          da.notes,
          jsonb_build_object(
            'channel_code', ch.code,
            'content_type', da.content_type,
            'post_date', to_char(da.post_date, 'YYYY-MM-DD'),
            'start_date', to_char(da.start_date, 'YYYY-MM-DD'),
            'end_date', to_char(da.end_date, 'YYYY-MM-DD'),
            'quantity', da.quantity,
            'has_experiencer', da.has_experiencer,
            'notes', da.notes
          ) AS detail_data
        FROM "DigitalAds" da
        JOIN "ServiceItems" si ON si.service_item_id = da.service_item_id
        JOIN "Contracts" c ON c.contract_id = si.contract_id
        JOIN "Channels" ch ON ch.channel_id = da.channel_id

        UNION ALL

        SELECT
          sr.rental_id AS booking_id,
          sr.service_item_id,
          c.contract_number,
          si.title AS service_item_title,
          si.service_type,
          CONCAT('Thuê studio ', st.name) AS description,
          NULL::text AS channel_code,
          to_char(sr.rental_start, 'YYYY-MM-DD') AS start_date,
          to_char(sr.rental_end, 'YYYY-MM-DD') AS end_date,
          NULL::text AS time_slot,
          sr.notes,
          jsonb_build_object(
            'studio_name', st.name,
            'rental_type', sr.rental_type,
            'rental_start', to_char(sr.rental_start, 'YYYY-MM-DD"T"HH24:MI'),
            'rental_end', to_char(sr.rental_end, 'YYYY-MM-DD"T"HH24:MI'),
            'notes', sr.notes
          ) AS detail_data
        FROM "StudioRentals" sr
        JOIN "ServiceItems" si ON si.service_item_id = sr.service_item_id
        JOIN "Contracts" c ON c.contract_id = si.contract_id
        JOIN "Studios" st ON st.studio_id = sr.st