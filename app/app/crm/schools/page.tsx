"use client";

import { useTable, List, EditButton, ShowButton, DeleteButton } from "@refinedev/antd";
import { Table, Space, Tag } from "antd";
import { useNavigation } from "@refinedev/core";
import { Suspense } from "react";

function SchoolListContent() {
  const { tableProps } = useTable({
    syncWithLocation: true,
    resource: "school",
    meta: {
      select: "*",
      idColumnName: "school_id",
    },
  });

  const { show, edit, create } = useNavigation();

  return (
    <List>
      <Table {...tableProps} rowKey="school_id">
        <Table.Column dataIndex="school_name" title="Name" />
        <Table.Column 
          dataIndex="department" 
          title="Groups"
          render={(departments: any[]) => (
            <Space size={[0, 4]} wrap>
              {departments?.map((dept, i) => (
                dept.group_name ? <Tag color="blue" key={i}>{dept.group_name}</Tag> : null
              ))}
            </Space>
          )}
        />
        <Table.Column dataIndex="school_short_id" title="Short ID" />
        <Table.Column 
          dataIndex="category" 
          title="Category"
          render={(value) => <Tag>{value}</Tag>}
        />
        <Table.Column 
          dataIndex="state" 
          title="State" 
          render={(value) => (
            <Tag color={value === 'paid' ? 'green' : 'red'}>{value}</Tag>
          )}
        />
        <Table.Column 
          dataIndex="amount" 
          title="Amount" 
          render={(value) => value ? `$${value}` : '-'}
        />
        <Table.Column 
          title="Actions"
          dataIndex="actions"
          render={(_, record: any) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.school_id} />
              <ShowButton hideText size="small" recordItemId={record.school_id} />
              <DeleteButton hideText size="small" recordItemId={record.school_id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
}

export default function SchoolList() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SchoolListContent />
    </Suspense>
  );
}
