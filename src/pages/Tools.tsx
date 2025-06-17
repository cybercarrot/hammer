import React, { useState } from 'react';
import { Text, Button, TextField, Flex, Box, Separator } from '@radix-ui/themes';
import * as Form from '@radix-ui/react-form';

// MARK: 小工具
const Tools: React.FC = () => {
  const [results, setResults] = useState<number[]>([]);
  const isDebug = process.env.NODE_ENV === 'development';

  const generateRandomNumbers = (formData: FormData) => {
    const maxNumber = parseInt(formData.get('maxNumber') as string);
    const count = parseInt(formData.get('count') as string);

    const numbers: number[] = [];
    for (let i = 0; i < count; i++) {
      const randomNum = Math.floor(Math.random() * maxNumber) + 1;
      numbers.push(randomNum);
    }
    setResults(numbers);
  };

  const getNumberStats = (numbers: number[]) => {
    const stats = new Map<number, number>();
    numbers.forEach(num => {
      stats.set(num, (stats.get(num) || 0) + 1);
    });
    return Array.from(stats.entries())
      .sort(([a], [b]) => a - b)
      .map(([num, count]) => `${num}: ${count}次`);
  };

  return (
    <Flex direction="column" height="100%">
      <Flex align="center" className="mb-2">
        <Text size="1" color="gray">
          随机整数生成
        </Text>
        <Separator orientation="horizontal" className="flex-auto ml-2" />
      </Flex>

      <Form.Root
        onSubmit={event => {
          event.preventDefault();
          generateRandomNumbers(new FormData(event.currentTarget));
        }}
      >
        <div className="mb-5">
          <Flex gap="4" align="end">
            <Box>
              <Text as="label" size="2" mb="1" className="block">
                最小值
              </Text>
              <div className="w-10 h-8 flex items-center justify-center">
                <Text size="2">1</Text>
              </div>
            </Box>

            <Form.Field name="maxNumber" className="relative">
              <Form.Label asChild>
                <Text as="label" size="2" mb="1" className="block">
                  最大值
                </Text>
              </Form.Label>
              <Form.Control asChild>
                <TextField.Root type="number" min={2} defaultValue={10} required className="w-30" />
              </Form.Control>
              <div className="absolute left-0 top-full">
                <Form.Message match="valueMissing" className="text-xs text-amber-600">
                  请输入最大值
                </Form.Message>
                <Form.Message match="rangeUnderflow" className="text-xs text-amber-600">
                  最大值必须大于等于2
                </Form.Message>
              </div>
            </Form.Field>

            <Form.Field name="count" className="relative">
              <Form.Label asChild>
                <Text as="label" size="2" mb="1" className="block">
                  个数
                </Text>
              </Form.Label>
              <Form.Control asChild>
                <TextField.Root
                  type="number"
                  min={1}
                  max={9999}
                  defaultValue={1}
                  required
                  className="w-30"
                />
              </Form.Control>
              <div className="absolute left-0 top-full">
                <Form.Message match="valueMissing" className="text-xs text-amber-600">
                  请输入个数
                </Form.Message>
                <Form.Message match="rangeUnderflow" className="text-xs text-amber-600">
                  个数必须大于等于1
                </Form.Message>
                <Form.Message match="rangeOverflow" className="text-xs text-amber-600">
                  个数不能超过9999
                </Form.Message>
              </div>
            </Form.Field>

            <Form.Submit asChild>
              <Button>生成随机数</Button>
            </Form.Submit>
          </Flex>
        </div>

        {results.length > 0 && (
          <Box className="mt-4">
            <Text size="3" weight="bold">
              结果：
            </Text>
            <Text size="3" className="ml-2">
              {results.join(', ')}
            </Text>
            {isDebug && (
              <Box className="mt-2">
                <Text size="2" color="gray">
                  统计：
                </Text>
                <Text size="2" color="gray" className="ml-2">
                  {getNumberStats(results).join(' | ')}
                </Text>
              </Box>
            )}
          </Box>
        )}
      </Form.Root>
    </Flex>
  );
};

export default Tools;
