import { useEffect, useMemo, useState } from 'react'
import { useGameApi } from '@/api/hooks'
import { Button } from '@/components/common/Button'
import './LoginPage.css'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { connect, login, loadInitialData, isConnected } = useGameApi()

  useEffect(() => {
    connect().catch(() => {
      setError('连接服务器失败')
    })
  }, [connect])

  const submitLabel = useMemo(() => {
    if (loading) {
      return '处理中...'
    }

    return isLogin ? '登录' : '注册'
  }, [isLogin, loading])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码')
      return
    }

    if (!isLogin && password !== confirmPassword) {
      setError('两次密码不一致')
      return
    }

    setLoading(true)

    try {
      // 先登录
      await login()
      // 登录成功后再加载初始数据
      await loadInitialData()
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">SLG Game</h1>

        <div className="login-tabs">
          <button
            className={`login-tab ${isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(true)
              setError('')
            }}
            type="button"
          >
            登录
          </button>
          <button
            className={`login-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(false)
              setError('')
            }}
            type="button"
          >
            注册
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              id="username"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="请输入用户名"
              type="text"
              value={username}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入密码"
              type="password"
              value={password}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">确认密码</label>
              <input
                id="confirmPassword"
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="请再次输入密码"
                type="password"
                value={confirmPassword}
              />
            </div>
          )}

          {error && <div className="login-error">{error}</div>}

          <Button disabled={loading || !isConnected} fullWidth size="large" type="submit">
            {submitLabel}
          </Button>

          <div className="login-tip">{isConnected ? '服务器已连接' : '正在连接服务器...'}</div>
        </form>
      </div>
    </div>
  )
}
