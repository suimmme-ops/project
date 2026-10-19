"""Versioned classroom data. Missing observations always remain missing."""
from pathlib import Path
import pandas as pd
import numpy as np
ROOT = Path(__file__).resolve().parents[1]
COUNTRIES = {'KOR':'대한민국','GBR':'영국','USA':'미국','CHN':'중국','IND':'인도','JPN':'일본','DEU':'독일','FRA':'프랑스','CAN':'캐나다','AUS':'호주','SAU':'사우디아라비아','QAT':'카타르','RUS':'러시아','IDN':'인도네시아','BRA':'브라질','ZAF':'남아프리카공화국'}
SCENARIOS = {
 '강력한 감축': {'id':'SSP1-1.9','color':'#087F75','values':[[1.5,1.2,1.7],[1.6,1.2,2.0],[1.4,1.0,1.8]],'story':'화석연료 사용을 빠르게 줄이고, 에너지와 이동 방식을 바꾸는 경로'},
 '중간 배출': {'id':'SSP2-4.5','color':'#6D5BD0','values':[[1.5,1.2,1.8],[2.0,1.6,2.5],[2.7,2.1,3.5]],'story':'배출을 줄이지만, 금세기 중반까지 감축이 충분히 빠르지 않은 경로'},
 '매우 높은 배출': {'id':'SSP5-8.5','color':'#D65338','values':[[1.6,1.3,1.9],[2.4,1.9,3.0],[4.4,3.3,5.7]],'story':'화석연료 중심의 개발과 높은 배출이 이어지는 경로'},
}
PERIODS = {2030:'2021–2040',2050:'2041–2060',2090:'2081–2100'}
def temperature():
    df = pd.read_csv(ROOT/'data/temperature.csv')
    df['rolling10'] = df.anomaly.rolling(10,min_periods=10).mean()
    return df

def emissions():
    return pd.read_csv(ROOT/'data/emissions.csv')

def observation(df, iso, year, column):
    d = df[(df.iso_code == iso) & (df.year == year)]
    return None if d.empty or pd.isna(d.iloc[0][column]) else float(d.iloc[0][column])

def scenario_at(name, year):
    vals = np.array(SCENARIOS[name]['values'])
    return tuple(float(np.interp(year,[2030,2050,2090],vals[:,i])) for i in range(3))

def country_ranking(df, year, column):
    # Exclude regional aggregates and retain only three-letter country codes.
    d = df[(df.year == year) & df.iso_code.fillna('').str.fullmatch('[A-Z]{3}')].dropna(subset=[column])
    return d.sort_values(column,ascending=False).reset_index(drop=True)
