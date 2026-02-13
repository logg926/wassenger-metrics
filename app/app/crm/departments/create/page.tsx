"use client";

import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select } from "antd";
import { Suspense } from "react";

function DepartmentCreateContent() {
  const { formProps, saveButtonProps } = useForm({
    resource: "department",
  });

  const { selectProps: schoolSelectProps } = useSelect({
    resource: "school",
    optionLabel: "school_name",
    optionValue: "school_id",
    meta: {
      idColumnName: "school_id",
    },
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
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
    </Create>
  );
}

export default function DepartmentCreate() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DepartmentCreateContent />
    </Suspense>
  );
}
