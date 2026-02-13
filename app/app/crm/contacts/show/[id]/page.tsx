"use client";

import { Show } from "@refinedev/antd";
import { Typography, Descriptions, Tag } from "antd";
import { useShow, useOne } from "@refinedev/core";
import { Suspense } from "react";

const { Title, Text } = Typography;

function ContactShowContent() {
  const { query } = useShow({
    resource: "crm_contacts",
  });
  const { data, isLoading } = query;
  const record = data?.data;

  const { query: schoolQuery } = useOne({
    resource: "school",
    id: record?.school_id || "",
    queryOptions: {
      enabled: !!record?.school_id,
    },
    meta: {
        idColumnName: "school_id"
    }
  });
  const { data: schoolData, isLoading: schoolIsLoading } = schoolQuery;

  if (isLoading) return <div>Loading...</div>;
  if (!record) return <div>Record not found</div>;

  return (
    <Show isLoading={isLoading}>
      <Title level={5}>Contact Details</Title>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Name">
           <Text>{record.name}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Phone">
           <Text>{record.phone}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Email">
           <Text>{record.email}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Role">
           <Text>{record.role}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="School">
           <Text>{schoolIsLoading ? "Loading..." : schoolData?.data?.school_name}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
           <Tag>{record.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Notes">
           <Text>{record.notes}</Text>
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
}

export default function ContactShow() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContactShowContent />
    </Suspense>
  );
}
