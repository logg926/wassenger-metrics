"use client";

import { Edit, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select } from "antd";
import { Suspense } from "react";

function DepartmentEditContent() {
  const { formProps, saveButtonProps, query } = useForm({
    resource: "department",
  }) as any;

  const { selectProps: schoolSelectProps } = useSelect({
    resource: "school",
    optionLabel: "school_name",
    optionValue: "school_id",
    defaultValue: query?.data?.data?.school_id,
    meta: {
      idColumnName: "school_id",
    },
  });

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="School"
          name="school_id"
          rules={[{ required: true }]}
        >
          <Select {...schoolSelectProps} />
        </Form.Item>
        <Form.Item
          label="Department Type"
          name="department_type"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Group Name"
          name="group_name"
        >
          <Input />
        </Form.Item>
         <Form.Item
          label="Remark"
          name="remark"
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Edit>
  );
}

export default function DepartmentEdit() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DepartmentEditContent />
    </Suspense>
  );
}
