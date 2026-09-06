exports.up = function up(knex) {
  return knex.schema
    .alterTable('request', (table) => {
      table.index('created_at', 'idx_request_created_at')
      table.index('status_id', 'idx_request_status_id')
      table.index('category_id', 'idx_request_category_id')
      table.index('priority_id', 'idx_request_priority_id')
      table.index('assignee_id', 'idx_request_assignee_id')
      table.index('requester_id', 'idx_request_requester_id')
    })
    .alterTable('audit_history', (table) => {
      table.index('request_protocol', 'idx_audit_history_request_protocol')
      table.index('action_type', 'idx_audit_history_action_type')
      table.index('occurred_at', 'idx_audit_history_occurred_at')
      table.index('performed_by', 'idx_audit_history_performed_by')
    })
    .alterTable('pending_item', (table) => {
      table.index('request_protocol', 'idx_pending_item_request_protocol')
      table.index('status', 'idx_pending_item_status')
      table.index('visible_to_requester', 'idx_pending_item_visible_to_requester')
    })
    .alterTable('comment', (table) => {
      table.index('request_protocol', 'idx_comment_request_protocol')
      table.index('is_internal', 'idx_comment_is_internal')
      table.index('created_at', 'idx_comment_created_at')
    })
    .alterTable('attachment', (table) => {
      table.index('request_protocol', 'idx_attachment_request_protocol')
      table.index('is_restricted', 'idx_attachment_is_restricted')
      table.index('uploaded_at', 'idx_attachment_uploaded_at')
    })
    .alterTable('category', (table) => {
      table.index('status', 'idx_category_status')
    })
    .alterTable('status', (table) => {
      table.index('sort_order', 'idx_status_sort_order')
    })
    .alterTable('assignee', (table) => {
      table.index('status', 'idx_assignee_status')
      table.index('email', 'idx_assignee_email')
    })
    .alterTable('requester', (table) => {
      table.index('corporate_email', 'idx_requester_corporate_email')
      table.index('area', 'idx_requester_area')
    })
}

exports.down = function down(knex) {
  return knex.schema
    .alterTable('request', (table) => {
      table.dropIndex([], 'idx_request_created_at')
      table.dropIndex([], 'idx_request_status_id')
      table.dropIndex([], 'idx_request_category_id')
      table.dropIndex([], 'idx_request_priority_id')
      table.dropIndex([], 'idx_request_assignee_id')
      table.dropIndex([], 'idx_request_requester_id')
    })
    .alterTable('audit_history', (table) => {
      table.dropIndex([], 'idx_audit_history_request_protocol')
      table.dropIndex([], 'idx_audit_history_action_type')
      table.dropIndex([], 'idx_audit_history_occurred_at')
      table.dropIndex([], 'idx_audit_history_performed_by')
    })
    .alterTable('pending_item', (table) => {
      table.dropIndex([], 'idx_pending_item_request_protocol')
      table.dropIndex([], 'idx_pending_item_status')
      table.dropIndex([], 'idx_pending_item_visible_to_requester')
    })
    .alterTable('comment', (table) => {
      table.dropIndex([], 'idx_comment_request_protocol')
      table.dropIndex([], 'idx_comment_is_internal')
      table.dropIndex([], 'idx_comment_created_at')
    })
    .alterTable('attachment', (table) => {
      table.dropIndex([], 'idx_attachment_request_protocol')
      table.dropIndex([], 'idx_attachment_is_restricted')
      table.dropIndex([], 'idx_attachment_uploaded_at')
    })
    .alterTable('category', (table) => {
      table.dropIndex([], 'idx_category_status')
    })
    .alterTable('status', (table) => {
      table.dropIndex([], 'idx_status_sort_order')
    })
    .alterTable('assignee', (table) => {
      table.dropIndex([], 'idx_assignee_status')
      table.dropIndex([], 'idx_assignee_email')
    })
    .alterTable('requester', (table) => {
      table.dropIndex([], 'idx_requester_corporate_email')
      table.dropIndex([], 'idx_requester_area')
    })
}