import plotly.graph_objects as go
from .data import SCENARIOS, scenario_at
INK='#203F2C'; TEAL='#27864C'; ORANGE='#D65338'

def base(fig,ytitle,xrange=None,yrange=None):
    fig.update_layout(height=420,margin=dict(l=15,r=25,t=55,b=25),paper_bgcolor='rgba(0,0,0,0)',plot_bgcolor='#FFFEF5',font=dict(family='Noto Sans KR, sans-serif',size=14,color=INK),hovermode='x unified',legend=dict(orientation='h',y=1.12,x=0),dragmode=False)
    fig.update_xaxes(title=None,showgrid=False,fixedrange=True,range=xrange,tickformat='d')
    fig.update_yaxes(title=ytitle,gridcolor='#E5EAD8',zerolinecolor='#CEDBD6',fixedrange=True,range=yrange)
    return fig

def temperature_chart(df,year,mode):
    col='rolling10' if mode=='10년 이동평균' else 'anomaly'
    fig=go.Figure()
    fig.add_trace(go.Scatter(x=df.year,y=df[col],mode='lines',line=dict(color='#CBD9D6',width=2),name='전체 기록',hovertemplate='%{y:.2f}℃<extra></extra>'))
    d=df[df.year<=year]
    fig.add_trace(go.Scatter(x=d.year,y=d[col],mode='lines',line=dict(color=TEAL,width=3),name=mode,hovertemplate='%{y:.2f}℃<extra></extra>'))
    v=df.loc[df.year==year,col].iloc[0]
    if not __import__('pandas').isna(v):fig.add_trace(go.Scatter(x=[year],y=[v],mode='markers',marker=dict(size=13,color=ORANGE,line=dict(width=3,color='white')),showlegend=False,hovertemplate='%{y:.2f}℃<extra></extra>'))
    fig.add_hline(y=1.5,line_dash='dot',line_color=ORANGE,annotation_text='1.5℃ 기준선',annotation_position='top left')
    fig.add_vline(x=year,line_color='#AAC6BF',line_dash='dot')
    return base(fig,'1850–1900 평균 대비 기온 차이 (℃)',[1850,2027],[-.4,1.8])

def countries_chart(df,codes,year,column='co2_per_capita'):
    from .data import COUNTRIES
    colors=[TEAL,'#6D5BD0',ORANGE,'#B17B18','#326EB5','#AD4280']
    fig=go.Figure()
    for i,code in enumerate(codes):
        d=df[(df.iso_code==code)&(df.year<=year)]
        fig.add_trace(go.Scatter(x=d.year,y=d[column],name=COUNTRIES.get(code,code),line=dict(width=3,color=colors[i%len(colors)]),connectgaps=False,hovertemplate='%{y:.2f}<extra></extra>'))
    all_values=df[df.iso_code.isin(codes)][column]
    hi=float(all_values.max())*1.1 if all_values.notna().any() else 1
    fig.add_vline(x=year,line_color='#AAC6BF',line_dash='dot')
    return base(fig,'1인당 CO₂ 배출량 (톤/명/년)' if column=='co2_per_capita' else '온실가스 배출량 (백만 톤 CO₂eq/년)',[1750,2026],[0,hi])

def future_chart(selected,year):
    fig=go.Figure()
    ys=list(range(2030,2091))
    s=SCENARIOS[selected];values=[scenario_at(selected,y) for y in ys]
    fig.add_trace(go.Scatter(x=ys,y=[v[2] for v in values],line=dict(width=0),hoverinfo='skip',showlegend=False))
    fig.add_trace(go.Scatter(x=ys,y=[v[1] for v in values],fill='tonexty',fillcolor='rgba(8,127,117,.10)',line=dict(width=0),name='선택 경로의 전망 범위',hoverinfo='skip'))
    for name,s in SCENARIOS.items():
        fig.add_trace(go.Scatter(x=ys,y=[scenario_at(name,y)[0] for y in ys],name=name,line=dict(color=s['color'],width=4 if name==selected else 2,dash='solid' if name==selected else 'dot'),hovertemplate='%{y:.2f}℃<extra></extra>'))
        fig.add_trace(go.Scatter(x=[2030,2050,2090],y=[v[0] for v in s['values']],mode='markers',marker=dict(size=8,color=s['color']),showlegend=False,hovertemplate='%{y:.1f}℃ · 20년 기간 평균<extra></extra>'))
    fig.add_vline(x=year,line_dash='dash',line_color=INK)
    fig.add_hline(y=1.5,line_dash='dot',line_color=ORANGE)
    return base(fig,'1850–1900 대비 기온 상승 (℃)',[2028,2092],[0,6])
