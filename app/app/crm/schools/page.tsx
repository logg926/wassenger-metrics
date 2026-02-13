"use client";

import { useTable, List, EditButton, ShowButton, DeleteButton } from "@refinedev/antd";
import { Table, Space, Tag, Form, Input, Select, Card, Row, Col } from "antd";
import { useNavigation, CrudFilters, HttpError } from "@refinedev/core";
import { Suspense } from "react";

function SchoolListContent() {
  const { tableProps, searchFormProps, setFilters } = useTable<{
    school_id: string;
    school_name: string;
    school_short_id: string;
    category: string;
    state: string;
    amount: number;
    department: any[];
  }, HttpError, { q: string; state: string; category: string }>({
    syncWithLocation: true,
    resource: "school",
    meta: {
      select: "*",
      idColumnName: "school_id",
    },
    onSearch: (params) => {
      const filters: CrudFilters = [];
      const { q, state, category } = params;

      if (q) {
        filters.push({
          field: "q",
          operator: "eq", 
          value: q,
        });
      }

      if (state) {
        filters.push({
          field: "state",
          operator: "eq",
          value: state,
        });
      }

      if (category) {
        filters.push({
          field: "category",
          operator: "eq",
          value: category,
        });
      }

      return filters;
    },
  });

  const { show, edit, create } = useNavigation();

  return (
    <List>
      <Card style={{ marginBottom: "20px" }}>
        <Form {...searchFormProps} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Search" name="q">
                <Input placeholder="Search by name or short ID" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="State" name="state">
                <Select
                  allowClear
                  placeholder="Select State"
                  options={[
                    { value: "paid", label: "Paid" },
                    { value: "not_paid", label: "Not Paid" },
                    { value: "rejected", label: "Rejected" },
                    { value: "quoted", label: "Quoted" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Category" name="category">
                <Select
                  allowClear
                  placeholder="Select Category"
                  options={[
                    { value: "primary", label: "Primary" },
                    { value: "secondary", label: "Secondary" },
                    { value: "kindergarten", label: "Kindergarten" },
                    { value: "special", label: "Special" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item>
                 <Space>
                   <button type="submit" className="ant-btn ant-btn-primary" onClick={searchFormProps.form?.submit}>Search</button>
                   <button 
                     type="button" 
                     className="ant-btn" 
                     onClick={() => {
                       searchFormProps.form?.resetFields();
                       setFilters([], "replace");
                     }}
                   >
                     Reset
                   </button>
                 </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Table {...tableProps} rowKey="school_id">
        <Table.Column dataIndex="school_name" title="Name" />
        <Table.Column 
          dataIndex="crm_contacts" 
          title="Contacts"
          render={(contacts: any[]) => (
            <Space direction="vertical" size={0}>
              {contacts?.map((contact, i) => (
                <div key={i} style={{ fontSize: '12px' }}>
                  <b>{contact.name}</b> {contact.phone ? `(${contact.phone})` : ''}
                </div>
              ))}
            </Space>
          )}
        />
        <Table.Column 
          dataIndex="teachers" 
          title="Teachers (Users)"
          render={(teachers: any[]) => (
            <Space direction="vertical" size={0}>
              {teachers?.map((teacher, i) => (
                <div key={i} style={{ fontSize: '12px' }}>
                  <Tag color={teacher.is_admin ? "purple" : "default"}>{teacher.name || 'Unknown'}</Tag>
                  <div style={{ color: '#888' }}>{teacher.email}</div>
                  {teacher.phone && <div>{teacher.phone}</div>}
                </div>
              ))}
            </Space>
          )}
        />
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
