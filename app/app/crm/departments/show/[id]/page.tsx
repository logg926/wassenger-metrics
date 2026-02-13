"use client";

import { Show, TextField } from "@refinedev/antd";
import { Typography, Descriptions } from "antd";
import { useShow, useOne } from "@refinedev/core";
import { Suspense } from "react";

const { Title, Text } = Typography;

function DepartmentShowContent() {
  const { query } = useShow({
    resource: "department",
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
      <Title level={5}>Department Details</Title>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="ID">
           <Text>{record.id}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="School">
           <Text>{schoolIsLoading ? "Loading..." : schoolData?.data?.school_name}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Type">
           <Text>{record.department_type}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Group Name">
           <Text>{record.group_name}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Remark">
           <Text>{record.remark}</Text>
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
}

export default function DepartmentShow() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DepartmentShowContent />
    </Suspense>
  );
}
