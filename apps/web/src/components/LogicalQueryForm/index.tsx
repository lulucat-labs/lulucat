import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Button,
  Form,
  Select,
  Input,
  InputNumber,
  Space,
  Card,
  Popover,
  Row,
  Col,
  message,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  ClearOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { QueryCondition } from '@/services/task/task-results';

const { Option } = Select;

/** 字段选项类型 */
export interface FieldOption {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean';
}

/** 操作符定义（基于服务端实际操作符） */
const OPERATORS = {
  string: [
    { value: '=', label: '等于' },
    { value: '!=', label: '不等于' },
    { value: 'contains', label: '包含' },
    { value: 'notContains', label: '不包含' },
    { value: 'isEmpty', label: '为空' },
    { value: 'isNotEmpty', label: '不为空' },
  ],
  number: [
    { value: '=', label: '等于' },
    { value: '!=', label: '不等于' },
    { value: '>', label: '大于' },
    { value: '<', label: '小于' },
    { value: '>=', label: '大于等于' },
    { value: '<=', label: '小于等于' },
    { value: 'isEmpty', label: '为空' },
    { value: 'isNotEmpty', label: '不为空' },
  ],
  boolean: [
    { value: '=', label: '等于' },
    // { value: '!=', label: '不等于' },
  ],
};

/** 组件属性接口 */
interface LogicalQueryFormProps {
  /** 可用字段选项 */
  fieldOptions: FieldOption[];
  /** 查询回调函数 */
  onQuery: (conditions: QueryCondition[]) => void;
  /** 重置回调函数 */
  onReset: () => void;
  /** localStorage 存储键名（用于存储和回填查询条件） */
  storageKey?: string;
  /** 初始查询条件 */
  initialConditions?: QueryCondition[];
  /** 是否显示重置按钮 */
  showResetButton?: boolean;
}

/** 单个查询条件接口 */
interface ConditionItem extends QueryCondition {
  id: string;
}

const LogicalQueryForm: React.FC<LogicalQueryFormProps> = ({
  fieldOptions,
  onQuery,
  onReset,
  storageKey,
  initialConditions = [],
  showResetButton = true,
}) => {
  // const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [conditions, setConditions] = useState<ConditionItem[]>([]);
  const initializedRef = useRef(false);

  // 从 localStorage 加载查询条件
  const loadConditionsFromStorage = useCallback(() => {
    if (!storageKey) return [];
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load conditions from localStorage:', error);
      return [];
    }
  }, [storageKey]);

  // 保存查询条件到 localStorage
  const saveConditionsToStorage = (conditions: QueryCondition[]) => {
    if (!storageKey) return;
    try {
      if (conditions.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(conditions));
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('Failed to save conditions to localStorage:', error);
    }
  };

  // 初始化条件
  useEffect(() => {
    // 防止重复初始化
    if (initializedRef.current) return;

    const storedConditions = loadConditionsFromStorage();
    const conditionsToUse = initialConditions.length > 0 ? initialConditions : storedConditions;

    if (conditionsToUse.length > 0) {
      const conditionsWithId = conditionsToUse.map((condition: QueryCondition, index: number) => ({
        ...condition,
        id: `condition_${Date.now()}_${index}`,
      }));
      setConditions(conditionsWithId);
      // 如果有存储的条件，自动执行查询
      if (storedConditions.length > 0 && initialConditions.length === 0) {
        onQuery(conditionsToUse);
      }
    } else {
      setConditions([]);
    }

    initializedRef.current = true;
  }, [initialConditions, loadConditionsFromStorage, onQuery]);

  // 重置初始化标记当storageKey改变时
  useEffect(() => {
    initializedRef.current = false;
  }, [storageKey]);

  // 添加新条件
  const addCondition = () => {
    // 默认选择第一个字段（如果存在）
    const firstField = fieldOptions.length > 0 ? fieldOptions[0] : null;

    // 创建新条件
    const newCondition: ConditionItem = {
      id: `condition_${Date.now()}`,
      name: firstField ? firstField.name : '',
      type: firstField ? firstField.type : 'string',
      operator: '',
      value: '',
    };

    // 如果存在字段选项，设置默认操作符
    if (firstField) {
      const operatorOptions = getOperatorOptions(firstField.type);
      if (operatorOptions.length > 0) {
        newCondition.operator = operatorOptions[0].value;
      }

      // 对于布尔类型，设置默认值为 false
      if (firstField.type === 'boolean') {
        newCondition.value = false;
      }
    }

    setConditions([...conditions, newCondition]);
  };

  // 获取字段对应的操作符选项
  const getOperatorOptions = (type: string) => {
    return OPERATORS[type as keyof typeof OPERATORS] || [];
  };

  // 删除条件
  const removeCondition = (id: string) => {
    setConditions(conditions.filter((condition) => condition.id !== id));
  };

  // 更新条件
  const updateCondition = (id: string, field: keyof QueryCondition, value: any) => {
    setConditions(
      conditions.map((condition) => {
        if (condition.id === id) {
          const updated = { ...condition, [field]: value };

          // 当字段改变时，重置操作符和值，并更新类型
          if (field === 'name') {
            const fieldOption = fieldOptions.find((opt) => opt.name === value);
            if (fieldOption) {
              updated.type = fieldOption.type;
              updated.operator = '';
              updated.value = fieldOption.type === 'boolean' ? false : '';
            }
          }

          return updated;
        }
        return condition;
      }),
    );
  };

  // 渲染值输入组件
  const renderValueInput = (condition: ConditionItem) => {
    const { type, operator, value } = condition;

    // 对于 isEmpty 和 isNotEmpty 操作符，不需要输入值
    if (operator === 'isEmpty' || operator === 'isNotEmpty') {
      return null;
    }

    switch (type) {
      case 'number':
        return (
          <InputNumber
            placeholder="请输入数值"
            value={value}
            onChange={(val) => updateCondition(condition.id, 'value', val)}
            style={{ width: '100%' }}
          />
        );
      case 'boolean':
        return (
          <Switch
            checked={value}
            onChange={(checked) => updateCondition(condition.id, 'value', checked)}
            checkedChildren="是"
            unCheckedChildren="否"
          />
        );
      default:
        return (
          <Input
            placeholder="请输入值"
            value={value}
            onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
          />
        );
    }
  };

  // 处理查询
  const handleQuery = () => {
    // 验证条件完整性
    const validConditions = conditions.filter((condition) => {
      if (!condition.name || !condition.operator) {
        return false;
      }
      // 对于需要值的操作符，检查值是否存在
      if (condition.operator !== 'isEmpty' && condition.operator !== 'isNotEmpty') {
        if (condition.value === '' || condition.value === null || condition.value === undefined) {
          return false;
        }
      }
      return true;
    });

    if (validConditions.length === 0) {
      message.warning('请至少添加一个完整的查询条件');
      return;
    }

    // 转换为 API 需要的格式
    const queryConditions: QueryCondition[] = validConditions.map(({ id: _, ...rest }) => rest);

    // 保存到 localStorage
    saveConditionsToStorage(queryConditions);

    // 执行查询
    onQuery(queryConditions);
    setVisible(false);
    message.success(`已应用 ${queryConditions.length} 个筛选条件`);
  };

  // 处理重置
  const handleReset = () => {
    setConditions([]);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
    onReset();
    setVisible(false);
    message.success('已重置查询条件');
  };

  // 渲染条件列表
  const renderConditions = () => {
    if (conditions.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          暂无查询条件，点击下方按钮添加
        </div>
      );
    }

    return conditions.map((condition, index) => (
      <Row gutter={[16, 16]} key={condition.id}>
        <Col span={8}>
          <Form.Item>
            <Select
              placeholder="选择字段"
              value={condition.name}
              onChange={(value) => updateCondition(condition.id, 'name', value)}
            >
              {fieldOptions.map((option) => (
                <Option key={option.name} value={option.name}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item>
            <Select
              placeholder="选择操作符"
              value={condition.operator}
              onChange={(value) => updateCondition(condition.id, 'operator', value)}
              disabled={!condition.name}
            >
              {getOperatorOptions(condition.type).map((op) => (
                <Option key={op.value} value={op.value}>
                  {op.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item>{renderValueInput(condition)}</Form.Item>
        </Col>
        <Col span={2}>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => removeCondition(condition.id)}
          />
        </Col>
      </Row>
    ));
  };

  // Popover 内容
  const popoverContent = (
    <div style={{ width: 600 }}>
      {renderConditions()}

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={addCondition}
        block
        style={{ marginBottom: 18 }}
      >
        添加条件
      </Button>

      <div style={{ textAlign: 'right' }}>
        <Space>
          {showResetButton && <Button onClick={handleReset}>重置</Button>}
          <Button type="primary" onClick={handleQuery}>
            查询
          </Button>
        </Space>
      </div>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      title="设置筛选条件"
      trigger="click"
      open={visible}
      onOpenChange={setVisible}
      placement="bottomLeft"
    >
      <Button type={conditions.length > 0 ? 'primary' : 'default'} icon={<FilterOutlined />}>
        筛选 {conditions.length > 0 && conditions.length}
      </Button>
    </Popover>
  );
};

export default LogicalQueryForm;
