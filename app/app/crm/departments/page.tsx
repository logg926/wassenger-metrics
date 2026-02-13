"use client";

import { List, useTable, EditButton, ShowButton, DeleteButton } from "@refinedev/antd";
import { Table, Space, Tag } from "antd";
import { Suspense } from "react";

function DepartmentListContent() {
  const { tableProps } = useTable({
    syncWithLocation: true,
    resource: "department",
    meta: {
      select: "*, school:school_id(school_name)",
    },
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column 
          dataIndex={["school", "school_name"]} 
          title="School Name"
          render={(value) => value || '-'}
        />
        <Table.Column dataIndex="department_type" title="Type" />
        <Table.Column dataIndex="group_name" title="Group Name" />
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

export default function DepartmentList() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DepartmentListContent />
    </Suspense>
  );
}
