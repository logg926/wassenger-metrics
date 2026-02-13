"use client";

import { List, useTable, EditButton, ShowButton, DeleteButton } from "@refinedev/antd";
import { Table, Space, Tag } from "antd";
import { Suspense } from "react";

function ContactListContent() {
  const { tableProps } = useTable({
    syncWithLocation: true,
    resource: "crm_contacts",
    meta: {
      select: "*, school:school_id(school_name)",
    },
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="name" title="Name" />
        <Table.Column dataIndex="phone" title="Phone" />
        <Table.Column dataIndex="email" title="Email" />
        <Table.Column dataIndex="role" title="Role" />
        <Table.Column 
          dataIndex={["school", "school_name"]} 
          title="School"
          render={(value) => value || '-'}
        />
        <Table.Column 
          dataIndex="status" 
          title="Status" 
          render={(value) => <Tag>{value}</Tag>}
        />
        <Table.Column 
          title="Actions"
          dataIndex="actions"
          render={(_, record: any) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              <ShowButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
}

export default function ContactList() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContactListContent />
    </Suspense>
  );
}
