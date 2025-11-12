'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { FlaskConical, ClipboardList, CheckCircle, XCircle, Clock, TrendingUp, Activity } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    received: 0,
    worklist: 0,
    completed: 0,
    failed: 0,
  })
  const [tatAlerts, setTatAlerts] = useState({
    approachingTAT: 0,
    outOfTAT: 0,
  })
  const [monthlyStats, setMonthlyStats] = useState({
    totalProcessed: 0,
    perClient: [] as any[],
    perTest: [] as any[],
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err))
    
    fetch('/api/dashboard/tat-alerts')
      .then(res => res.json())
      .then(data => setTatAlerts(data))
      .catch(err => console.error(err))

    fetch('/api/dashboard/monthly-stats')
      .then(res => res.json())
      .then(data => setMonthlyStats(data))
      .catch(err => console.error(err))
  }, [])

  return (
    <MainLayout>
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-green-500 to-green-400 p-8 md:p-12 text-white shadow-xl">
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              Laboratory Operations
            </h1>
            <p className="text-xl text-green-50 mb-6 max-w-2xl">
              Omics Excellence, African Innovation
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30">
                <div className="text-3xl font-bold">{stats.received + stats.worklist + stats.completed}</div>
                <div className="text-sm text-green-50">Total Samples</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30">
                <div className="text-3xl font-bold">{stats.completed}</div>
                <div className="text-sm text-green-50">Completed Today</div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48 blur-3xl"></div>
        </div>

        {/* Key Metrics */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Key Performance Indicators</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-400"></div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Received</CardTitle>
                  <div className="h-12 w-12 rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors flex items-center justify-center">
                    <FlaskConical className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900 mb-2">{stats.received}</div>
                <p className="text-sm text-slate-500">Samples received</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-400"></div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">In Worklist</CardTitle>
                  <div className="h-12 w-12 rounded-xl bg-purple-100 group-hover:bg-purple-200 transition-colors flex items-center justify-center">
                    <ClipboardList className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900 mb-2">{stats.worklist}</div>
                <p className="text-sm text-slate-500">Active worklists</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-green-500 to-green-400"></div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Completed</CardTitle>
                  <div className="h-12 w-12 rounded-xl bg-green-100 group-hover:bg-green-200 transition-colors flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900 mb-2">{stats.completed}</div>
                <p className="text-sm text-slate-500">Samples completed</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-red-500 to-red-400"></div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Requires Attention</CardTitle>
                  <div className="h-12 w-12 rounded-xl bg-red-100 group-hover:bg-red-200 transition-colors flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900 mb-2">{stats.failed}</div>
                <p className="text-sm text-slate-500">Failed/Repeats</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* TAT Alerts and Statistics */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-0 shadow-lg bg-white">
            <CardHeader className="pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">TAT Alerts</CardTitle>
                  <CardDescription className="text-slate-600">Turnaround time notifications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 rounded-xl border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-50/50 hover:from-yellow-100 hover:to-yellow-50 transition-all">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-lg">Samples approaching TAT</p>
                    <p className="text-sm text-slate-600 mt-1">{tatAlerts.approachingTAT} samples need attention</p>
                  </div>
                  <div className="h-14 w-14 rounded-xl bg-yellow-100 flex items-center justify-center ml-4">
                    <Clock className="h-7 w-7 text-yellow-600" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-5 rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-red-50/50 hover:from-red-100 hover:to-red-50 transition-all">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-lg">Samples out of TAT</p>
                    <p className="text-sm text-slate-600 mt-1">{tatAlerts.outOfTAT} samples overdue</p>
                  </div>
                  <div className="h-14 w-14 rounded-xl bg-red-100 flex items-center justify-center ml-4">
                    <XCircle className="h-7 w-7 text-red-600" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Monthly Statistics</CardTitle>
                  <CardDescription className="text-slate-600">Current month summary</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-50/50 border border-slate-100 hover:from-slate-100 hover:to-slate-50 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">Total Processed</span>
                    <span className="font-bold text-2xl text-slate-900">{monthlyStats.totalProcessed}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(monthlyStats.year, monthlyStats.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                {monthlyStats.perClient.length > 0 && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-50/50 border border-slate-100 hover:from-slate-100 hover:to-slate-50 transition-all">
                    <div className="mb-2">
                      <span className="text-sm font-semibold text-slate-700">Top Clients</span>
                    </div>
                    <div className="space-y-2">
                      {monthlyStats.perClient.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 truncate">{item.client}</span>
                          <span className="font-semibold text-slate-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {monthlyStats.perTest.length > 0 && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-50/50 border border-slate-100 hover:from-slate-100 hover:to-slate-50 transition-all">
                    <div className="mb-2">
                      <span className="text-sm font-semibold text-slate-700">Top Tests</span>
                    </div>
                    <div className="space-y-2">
                      {monthlyStats.perTest.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 truncate">{item.displayName}</span>
                          <span className="font-semibold text-slate-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Section */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-slate-50 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-green-100 group-hover:bg-green-200 transition-colors flex items-center justify-center">
                    <FlaskConical className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">New Sample</h3>
                    <p className="text-sm text-slate-600">Register a new sample</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-slate-50 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors flex items-center justify-center">
                    <ClipboardList className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Create Worklist</h3>
                    <p className="text-sm text-slate-600">Start a new worklist</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-slate-50 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-purple-100 group-hover:bg-purple-200 transition-colors flex items-center justify-center">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">View Reports</h3>
                    <p className="text-sm text-slate-600">Generate reports</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}


