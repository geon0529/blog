import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronUp, ChevronDown, Edit, Trash2, Eye } from "lucide-react";

// 타입 정의
interface Employee {
  id: number;
  name: string;
  department: string;
  position: string;
  salary: number;
  status: "재직중" | "휴가중" | "퇴사";
  joinDate: string;
}

interface SortConfig {
  key: keyof Employee | null;
  direction: "asc" | "desc";
}

type StatusVariant = "default" | "secondary" | "destructive";

// 샘플 데이터
const employeeData: Employee[] = [
  {
    id: 1,
    name: "김민수",
    department: "개발팀",
    position: "시니어 개발자",
    salary: 7500,
    status: "재직중",
    joinDate: "2021-03-15",
  },
  {
    id: 2,
    name: "이지영",
    department: "디자인팀",
    position: "UI/UX 디자이너",
    salary: 6000,
    status: "재직중",
    joinDate: "2022-01-10",
  },
  {
    id: 3,
    name: "박철수",
    department: "마케팅팀",
    position: "마케팅 매니저",
    salary: 6500,
    status: "휴가중",
    joinDate: "2020-09-01",
  },
  {
    id: 4,
    name: "정수진",
    department: "개발팀",
    position: "프론트엔드 개발자",
    salary: 5500,
    status: "재직중",
    joinDate: "2023-02-20",
  },
  {
    id: 5,
    name: "최영호",
    department: "영업팀",
    position: "영업 대리",
    salary: 4500,
    status: "재직중",
    joinDate: "2023-08-01",
  },
];

// 상태 배지 컴포넌트
const StatusBadge: React.FC<{ status: Employee["status"] }> = ({ status }) => {
  const getVariant = (status: Employee["status"]): StatusVariant => {
    switch (status) {
      case "재직중":
        return "default";
      case "휴가중":
        return "secondary";
      case "퇴사":
        return "destructive";
      default:
        return "default";
    }
  };

  return <Badge variant={getVariant(status)}>{status}</Badge>;
};

// 정렬 아이콘 컴포넌트
const SortIcon: React.FC<{
  column: keyof Employee;
  sortConfig: SortConfig;
}> = ({ column, sortConfig }) => {
  if (sortConfig.key !== column) return null;
  return sortConfig.direction === "asc" ? (
    <ChevronUp className="ml-1 h-4 w-4" />
  ) : (
    <ChevronDown className="ml-1 h-4 w-4" />
  );
};

// Storybook Meta 설정
const meta: Meta<typeof Table> = {
  title: "Components/Table",
  component: Table,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "shadcn/ui Table 컴포넌트의 다양한 사용 예제들입니다.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 스토리 1: 기본 테이블
export const 기본테이블: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">기본 테이블</h3>
        <p className="text-gray-600 text-sm mb-4">
          가장 기본적인 테이블 형태입니다.
        </p>
      </div>

      <Table>
        <TableCaption>직원 정보 목록</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>이름</TableHead>
            <TableHead>부서</TableHead>
            <TableHead>직책</TableHead>
            <TableHead className="text-right">연봉 (만원)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employeeData.map((employee: Employee) => (
            <TableRow key={employee.id}>
              <TableCell className="font-medium">{employee.name}</TableCell>
              <TableCell>{employee.department}</TableCell>
              <TableCell>{employee.position}</TableCell>
              <TableCell className="text-right">
                {employee.salary.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

// 스토리 2: 정렬 가능한 테이블
export const 정렬가능한테이블: Story = {
  render: () => {
    const [sortConfig, setSortConfig] = useState<SortConfig>({
      key: null,
      direction: "asc",
    });

    const handleSort = (key: keyof Employee): void => {
      let direction: "asc" | "desc" = "asc";
      if (sortConfig.key === key && sortConfig.direction === "asc") {
        direction = "desc";
      }
      setSortConfig({ key, direction });
    };

    const sortedData = useMemo((): Employee[] => {
      if (!sortConfig.key) return employeeData;

      return [...employeeData].sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }, [sortConfig]);

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">정렬 가능한 테이블</h3>
          <p className="text-gray-600 text-sm mb-4">
            컬럼 헤더를 클릭하여 정렬할 수 있습니다.
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  이름
                  <SortIcon column="name" sortConfig={sortConfig} />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort("department")}
              >
                <div className="flex items-center">
                  부서
                  <SortIcon column="department" sortConfig={sortConfig} />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort("salary")}
              >
                <div className="flex items-center">
                  연봉 (만원)
                  <SortIcon column="salary" sortConfig={sortConfig} />
                </div>
              </TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((employee: Employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>{employee.salary.toLocaleString()}</TableCell>
                <TableCell>
                  <StatusBadge status={employee.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  },
};

// 스토리 3: 선택 가능한 테이블
export const 선택가능한테이블: Story = {
  render: () => {
    const [selectedRows, setSelectedRows] = useState<number[]>([]);

    const handleRowSelect = (id: number): void => {
      setSelectedRows((prev: number[]) =>
        prev.includes(id)
          ? prev.filter((rowId: number) => rowId !== id)
          : [...prev, id]
      );
    };

    const handleSelectAll = (): void => {
      setSelectedRows(
        selectedRows.length === employeeData.length
          ? []
          : employeeData.map((item: Employee) => item.id)
      );
    };

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">선택 가능한 테이블</h3>
          <p className="text-gray-600 text-sm mb-4">
            선택된 행: {selectedRows.length}개
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedRows.length === employeeData.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>이름</TableHead>
              <TableHead>부서</TableHead>
              <TableHead>직책</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeeData.map((employee: Employee) => (
              <TableRow
                key={employee.id}
                className={
                  selectedRows.includes(employee.id) ? "bg-blue-50" : ""
                }
              >
                <TableCell>
                  <Checkbox
                    checked={selectedRows.includes(employee.id)}
                    onCheckedChange={() => handleRowSelect(employee.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>
                  <StatusBadge status={employee.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  },
};

// 스토리 4: 필터링 가능한 테이블
export const 필터링가능한테이블: Story = {
  render: () => {
    const [filter, setFilter] = useState<string>("");

    const filteredData = useMemo((): Employee[] => {
      if (!filter) return employeeData;
      return employeeData.filter(
        (item: Employee) =>
          item.name.toLowerCase().includes(filter.toLowerCase()) ||
          item.department.toLowerCase().includes(filter.toLowerCase()) ||
          item.position.toLowerCase().includes(filter.toLowerCase())
      );
    }, [filter]);

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">필터링 가능한 테이블</h3>
          <p className="text-gray-600 text-sm mb-4">
            검색어를 입력하여 데이터를 필터링할 수 있습니다.
          </p>
        </div>

        <Input
          placeholder="이름, 부서, 직책으로 검색..."
          value={filter}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFilter(e.target.value)
          }
          className="max-w-sm mb-4"
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>부서</TableHead>
              <TableHead>직책</TableHead>
              <TableHead>입사일</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((employee: Employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.joinDate}</TableCell>
                  <TableCell>
                    <StatusBadge status={employee.status} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  검색 결과가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  },
};

// 스토리 5: 페이지네이션 테이블
export const 페이지네이션테이블: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage: number = 3;

    const paginatedData = useMemo((): Employee[] => {
      const startIndex: number = (currentPage - 1) * itemsPerPage;
      return employeeData.slice(startIndex, startIndex + itemsPerPage);
    }, [currentPage]);

    const totalPages: number = Math.ceil(employeeData.length / itemsPerPage);
    const startItem: number = Math.min(
      (currentPage - 1) * itemsPerPage + 1,
      employeeData.length
    );
    const endItem: number = Math.min(
      currentPage * itemsPerPage,
      employeeData.length
    );

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">페이지네이션 테이블</h3>
          <p className="text-gray-600 text-sm mb-4">
            페이지당 {itemsPerPage}개 항목을 표시합니다.
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>부서</TableHead>
              <TableHead>직책</TableHead>
              <TableHead className="text-right">연봉 (만원)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((employee: Employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell className="text-right">
                  {employee.salary.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            총 {employeeData.length}개 중 {startItem}-{endItem}개 표시
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              이전
            </Button>
            <span className="text-sm px-3 py-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              다음
            </Button>
          </div>
        </div>
      </div>
    );
  },
};

// 스토리 6: 액션 버튼이 있는 테이블
export const 액션버튼테이블: Story = {
  render: () => {
    const handleView = (employee: Employee): void => {
      alert(`${employee.name}의 정보를 확인합니다.`);
    };

    const handleEdit = (employee: Employee): void => {
      alert(`${employee.name}의 정보를 수정합니다.`);
    };

    const handleDelete = (employee: Employee): void => {
      if (confirm(`${employee.name}을(를) 정말 삭제하시겠습니까?`)) {
        alert(`${employee.name}이(가) 삭제되었습니다.`);
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">
            액션 버튼이 있는 테이블
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            각 행에 액션 버튼을 추가할 수 있습니다.
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>부서</TableHead>
              <TableHead>직책</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="w-32">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeeData.map((employee: Employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>
                  <StatusBadge status={employee.status} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleView(employee)}
                      title="보기"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEdit(employee)}
                      title="수정"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(employee)}
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  },
};
