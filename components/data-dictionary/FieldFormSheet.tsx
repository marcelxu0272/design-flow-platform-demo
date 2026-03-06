"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import type { DataField, EngineeringDiscipline } from "@/lib/types/database.types"
import { toast } from "sonner"
import { useCreateDataField, useUpdateDataField } from "@/lib/hooks/useDataFields"

const DISCIPLINES = [
  { value: "process", label: "工艺" },
  { value: "piping", label: "配管" },
  { value: "instrumentation", label: "仪控" },
  { value: "equipment", label: "设备" },
  { value: "electrical", label: "电气" },
  { value: "civil", label: "土建" },
  { value: "general", label: "总图" },
]

const DATA_TYPES = ["string", "number", "boolean", "date", "datetime", "text", "json"]

const schema = z.object({
  field_code: z.string().min(1, "必填").regex(/^[A-Z0-9_]+$/, "仅大写字母、数字、下划线"),
  field_name: z.string().min(1, "必填"),
  data_type: z.string().min(1, "必填"),
  max_length: z.number().optional().nullable(),
  nullable: z.boolean(),
  is_unique: z.boolean(),
  engineering_discipline: z.string().optional().nullable(),
  unit_of_measure: z.string().optional().nullable(),
  standard_ref: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
})

type FormValues = z.infer<typeof schema>

interface FieldFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  field?: DataField | null
}

export function FieldFormSheet({ open, onOpenChange, field }: FieldFormSheetProps) {
  const createMutation = useCreateDataField()
  const updateMutation = useUpdateDataField()
  const isEditing = !!field

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      field_code: field?.field_code ?? "",
      field_name: field?.field_name ?? "",
      data_type: field?.data_type ?? "string",
      max_length: field?.max_length ?? null,
      nullable: field?.nullable ?? true,
      is_unique: field?.is_unique ?? false,
      engineering_discipline: field?.engineering_discipline ?? null,
      unit_of_measure: field?.unit_of_measure ?? null,
      standard_ref: field?.standard_ref ?? null,
      description: field?.description ?? null,
    },
  })

  const onSubmit = async (values: FormValues) => {
    const typedValues = {
      ...values,
      engineering_discipline: values.engineering_discipline as EngineeringDiscipline | null | undefined,
    }
    try {
      if (isEditing && field) {
        await updateMutation.mutateAsync({ id: field.id, data: typedValues })
        toast.success("字段已更新")
      } else {
        await createMutation.mutateAsync(typedValues)
        toast.success("字段已创建")
      }
      onOpenChange(false)
      form.reset()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "操作失败")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "编辑字段" : "新建字段"}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="field_code"
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>字段编码 *</FormLabel>
                    <FormControl>
                      <Input {...f} placeholder="如 PIPE_DIAMETER" disabled={isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="field_name"
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>字段名称 *</FormLabel>
                    <FormControl>
                      <Input {...f} placeholder="如 管道外径" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_type"
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>数据类型 *</FormLabel>
                    <Select onValueChange={f.onChange} value={f.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DATA_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="engineering_discipline"
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>专业归属</FormLabel>
                    <Select onValueChange={f.onChange} value={f.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择专业" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DISCIPLINES.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit_of_measure"
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>计量单位</FormLabel>
                    <FormControl>
                      <Input {...f} value={f.value ?? ""} placeholder="如 MPa / ℃ / mm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="standard_ref"
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>标准规范</FormLabel>
                    <FormControl>
                      <Input {...f} value={f.value ?? ""} placeholder="如 GB/T 50316" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nullable"
                render={({ field: f }) => (
                  <FormItem className="flex items-center justify-between rounded border p-3">
                    <FormLabel className="cursor-pointer">允许为空</FormLabel>
                    <FormControl>
                      <Switch checked={f.value} onCheckedChange={f.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_unique"
                render={({ field: f }) => (
                  <FormItem className="flex items-center justify-between rounded border p-3">
                    <FormLabel className="cursor-pointer">唯一值</FormLabel>
                    <FormControl>
                      <Switch checked={f.value} onCheckedChange={f.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea {...f} value={f.value ?? ""} rows={3} placeholder="字段用途说明" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEditing ? "保存" : "创建"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
