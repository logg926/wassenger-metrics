"use client";

import { Edit, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select } from "antd";
import { Suspense } from "react";

function ContactEditContent() {
  const { formProps, saveButtonProps, query } = useForm({
    resource: "crm_contacts",
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
          label="Name"
          name="name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Phone"
          name="phone"
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Email"
          name="email"
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Role"
          name="role"
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="School"
          name="school_id"
        >
          <Select {...schoolSelectProps} />
        </Form.Item>
        <Form.Item
          label="Status"
          name="status"
        >
          <Select
            options={[
              { value: "new", label: "New" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </Form.Item>
        <Form.Item
            label="Notes"
            name="notes"
        >
            <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Edit>
  );
}

export default function ContactEdit() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContactEditContent />
    </Suspense>
  );
}
