增加新的大功能，实现全物品的报价查询

输入查询时间（往前几个小时），然后一个下拉菜单，里面是全部的物品，可以选择把物品设成关注，对于每一个物品都可以选择关注的Q等级，也可以不选等级。可以选择多个关注物品，每个物品也可选择多个关注等级

物品的报价通常有几种形式
1. 直接报价格，例如：selling q2 :re-10: 34.5$
2. 报市场价减多少百分比，例如：Buying :re-49: 1000 -3% market或 Buy :re-1: -3%mp 
3. 报市场价减多少具体金额， 例如：Buying 3k :re-111: mp-100

对于买和卖来说，关键词与航天的筛选差不多，例如：buying, buy, looking for, look for, sale,seeling等等

对于结果的展示，需要有两种界面，第一个与航天一样；第二种直接罗列符合条件的原始消息，按照时间从近到远


对于第二个部分实现，你可以参考https://github.com/mirceaman56/sim-companies-helper

这个功能中关注的物品和对应质量最好能持久化保存


data/crude_data.txt中有部分示例数据，当中有一些关于彩蛋相关的swap或者寻找内容，全部忽略

对应产品编号之前我们项目的代码中有，你也可参考https://simcompanies.proboards.com/thread/61/product-reference-numbers

这个功能在ui中是另一个按钮打开，可以把之前的按钮分成两半，一半打开航天的，一半是这个