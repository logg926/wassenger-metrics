"use client";

import { Show, TextField, DateField, EmailField, UrlField } from "@refinedev/antd";
import { Typography, Tag, Descriptions } from "antd";
import { useShow, useOne } from "@refinedev/core";
import { Suspense } from "react";

const { Title, Text } = Typography;

function SchoolShowContent() {
  const { query } = useShow({
    resource: "school",
    meta: {
      idColumnName: "school_id",
    },
  });
  const { data, isLoading } = query;
  const record = data?.data;

  if (isLoading) return <div>Loading...</div>;
  if (!record) return <div>Record not found</div>;

  return (
    <Show isLoading={isLoading}>
      <Title level={5}>School Details</Title>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Name">
           <Text>{record.school_name}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Short ID">
           <Text>{record.school_short_id}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="ID">
           <Text>{record.school_id}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Category">
           <Tag>{record.category}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="State">
           <Tag color={record.state === 'paid' ? 'green' : 'red'}>{record.state}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Amount">
           <Text>{record.amount}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Notes">
           <Text>{record.notes}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Last Contact">
           <DateField value={record.last_contact} />
        </Descriptions.Item>
        <Descriptions.Item label="Change of Date">
           <DateField value={record.change_of_date} />
        </Descriptions.Item>
        <Descriptions.Item label="Region">
           <Text>{record.region}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Address">
           <Text>{record.data_json?.address}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="District">
           <Text>{record.data_json?.district}</Text>
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
}

export default function SchoolShow() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SchoolShowContent />
    </Suspense>
  );
}
