// The shared API envelope and the `?type=parameters` config shape — the frontend
// half of the contract in `common/api/response.py` and
// `common/api/query_params.py`.
//
// These live here, not in a service, because every list service needs them. Put
// them in one service and the others cross-import it, which makes that service a
// de-facto hub and invites a circular dependency.
//
// Field names match `build_parameters_config()` exactly. They previously did not
// (`display_name`/`allow_multiple` here vs `label`/`type` on the wire), which is
// the precise failure the contract job now exists to catch: both sides compiled,
// and the toolbar just rendered blank filter headings.

export type FilterOption = {
  value: string;
  label: string;
};

/**
 * One filter the backend offers for a list.
 *
 * `default_value` is applied only on first load, before the user has expressed a
 * preference. URL filters always win — otherwise a shared link would silently
 * re-apply the default over the filters it was meant to carry.
 */
export type FilterConfig = {
  key: string;
  label: string;
  type: 'multi_select' | 'single_select';
  options: FilterOption[];
  default_value?: string[];
};

/** A searchable or sortable column the backend will accept. */
export type FieldConfig = {
  key: string;
  label: string;
};

/** The full `?type=parameters` payload. */
export type ParametersConfig = {
  filters: FilterConfig[];
  search_fields: FieldConfig[];
  sort_fields: FieldConfig[];
  default_sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
};

export type ApiMeta = {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  data: T;
  meta: ApiMeta;
  errors: unknown;
};
