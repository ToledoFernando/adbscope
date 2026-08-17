"use client"

import { TrendingUp } from "lucide-react"
import { Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { ReactNode } from "react"

interface Props<T> {
    config?: ChartConfig
    data: T[]
    footerComponent?: ReactNode
    headerComponent?: ReactNode
    dataKey: string
    nameKey: string
    children?: ReactNode
    valueFormatter?: (value: number) => ReactNode
}

export default function ChartPie<T>({data, config = {}, dataKey, nameKey, footerComponent, headerComponent, valueFormatter, children}: Props<T>) {
  return (
    <Card className="flex flex-col">
        {
            headerComponent && 
      <CardHeader className="items-center pb-0">
        {headerComponent}
        {/* <CardTitle>Pie Chart - Donut</CardTitle>
        <CardDescription>January - June 2024</CardDescription> */}
      </CardHeader>
        }
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={config}
          className="mx-auto aspect-square"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={
                    valueFormatter &&
                    ((value, name, item, index, payload) => (
                      <>
                        {item.payload?.fill && (
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: item.payload.fill }}
                          />
                        )}
                        <div className="flex flex-1 justify-between leading-none">
                          <span className="text-muted-foreground">{name}</span>
                          <span className="font-mono font-medium text-foreground tabular-nums">
                            {valueFormatter(value as number)}
                          </span>
                        </div>
                      </>
                    ))
                  }
                />
              }
            />
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              cornerRadius={6}
              paddingAngle={6}
              innerRadius={50}
            >
                {children}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
        {footerComponent && 
      <CardFooter className="flex-col gap-2 text-sm">
        {footerComponent}
      </CardFooter>
    }
    </Card>
  )
}
