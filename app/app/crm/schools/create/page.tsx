"use client";

import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, InputNumber } from "antd";
import { Suspense } from "react";

function SchoolCreateContent() {
  const { formProps, saveButtonProps } = useForm({
    resource: "school",
    meta: {
      idColumnName: "school_id",
    },
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="School Name"
          name="school_name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Short ID"
          name="school_short_id"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Category"
          name="category"
        >
          <Select
            options={[
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
              { value: "kindergarten", label: "Kindergarten" },
              { value: "special", label: "Special" },
            ]}
          />
        </Form.Item>
         <Form.Item
          label="State"
          name="state"
        >
           <Select
            options={[
              { value: "paid", label: "Paid" },
              { value: "not_paid", label: "Not Paid" },
              { value: "trial", label: "Trial" },
            ]}
          />
        </Form.Item>
        <Form.Item
          label="Amount"
          name="amount"
        >
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          label="Show"
          name="show"
          valuePropName="checked"
          initialValue={true}
        >
          <Checkbox>Show in list</Checkbox>
        </Form.Item>
        <Form.Item
            label="Notes"
            name="notes"
        >
            <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Create>
  );
}

export default function SchoolCreate() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SchoolCreateContent />
    </Suspense>
  );
}
