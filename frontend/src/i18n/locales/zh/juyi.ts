// 聚蚁二开文案(独立命名空间,upstream 合并零冲突)
export default {
  juyi: {
    home: {
      eyebrow: '订阅聚合网关',
      heroTitleA: '把订阅，',
      heroTitleB: '聚成 API。',
      heroDesc: '聚蚁把多个 AI 订阅账号汇成一个稳定端点：统一密钥、蚁群调度、按量计费。',
      pipelineCaption: '多个订阅源 → 聚蚁调度核心 → 统一 API 端点',
      steps: {
        title: '三步接入',
        subtitle: '不改业务代码，只换一个 base_url',
        s1Title: '注册账号',
        s1Desc: '邮箱注册登录，进入控制台',
        s2Title: '创建密钥',
        s2Desc: '在密钥页生成 sk- 开头的 API Key',
        s3Title: '替换端点',
        s3Desc: '把 base_url 指向聚蚁，模型照常调用',
        copy: '复制示例',
        copied: '已复制'
      },
      features: {
        title: '为高频调用而生',
        subtitle: '蚁群的方式：每只蚂蚁都很小，汇在一起就很稳',
        gateway: '多平台聚合',
        gatewayDesc: 'Claude、Codex、Gemini 等订阅统一成一个入口，一把密钥全通',
        schedule: '蚁群调度',
        scheduleDesc: '账号池自动负载均衡与会话保持，单账号故障自动绕行',
        billing: '按量计费',
        billingDesc: '请求级用量与成本记录，余额、配额、限额一目了然',
        stats: '实时统计',
        statsDesc: '模型分布、Token 趋势、耗时性能，图表随用随查',
        keys: '多密钥管理',
        keysDesc: '按项目分发密钥，独立限额与统计，可随时吊销',
        redeem: '兑换与邀请',
        redeemDesc: '兑换码充值、邀请奖励，额度获取路径清晰'
      },
      faq: {
        title: '常见问题',
        q1: '怎么计费？',
        a1: '按实际调用量计费：每次请求的 Token 用量折算成本，从余额扣减，用量页可逐条核对。',
        q2: '和直连官方 API 有什么区别？',
        a2: '调用方式完全一致，只是 base_url 指向聚蚁。聚蚁在后端把请求调度到订阅账号池，单账号限流或故障时自动切换。',
        q3: '密钥和数据安全吗？',
        a3: '密钥仅用于网关鉴权，可随时吊销重建；请求内容不做持久化留存，仅记录用量元数据（模型、Token 数、耗时）。'
      },
      manifesto: {
        titleA: '一只蚂蚁很脆弱，',
        titleB: '一个蚁群什么都搬得动。',
        sub: '每一份订阅都是一只工蚁；聚蚁把它们编成一队永不下班的后勤兵，扛住每一次调用。'
      },
      poweredBy: '基于开源项目 Sub2API 构建'
    },
    dash: {
      greetingMorning: '早上好',
      greetingAfternoon: '下午好',
      greetingEvening: '晚上好',
      heroTag: '蚁群调度运行中',
      endpoint: '接入端点',
      copied: '已复制',
      createKey: '创建密钥',
      viewDocs: '查看文档'
    },
    hive: {
      title: '账号蜂巢',
      subtitle: '服务账号池实时健康',
      active: '正常',
      inactive: '停用',
      error: '异常',
      manage: '管理账号',
      empty: '暂无服务账号，去添加第一个',
      more: '还有 {n} 个'
    },
    appearance: {
      title: '外观',
      theme: '主题色',
      font: '字体',
      themes: {
        honey: '蜜琥珀',
        pheromone: '信息素青',
        nightfall: '靛夜',
        ember: '炭玫'
      },
      fonts: {
        default: '默认黑体',
        serif: '衬线宋体',
        mono: '等宽极客'
      }
    }
  }
}
