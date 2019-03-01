import React, { Component } from "react";
import "./sass/App.scss";
import regression from "regression";
import axios from "axios";

class App extends Component {
  state = {
    stockName: "aapl",
    regressionInfo: {},
    currentPrice: 0,
    startPrice: 0,
    spyStartPrice: 0,
    spyEndPrice: 0,
    displayStatistics: false,
    displayPredictions: false,
    displayErrors: false,
    displayChanges: false,
    displayPerformance: false
  };
  componentDidMount() {
    this.fetchCurrentStockData();
    this.fetchStockData();
    this.fetchSpyPrices();
  }

  fetchSpyPrices = async () => {
    const res = await axios.get(
      `https://api.iextrading.com/1.0/stock/spy/chart/5y`
    );
    this.setState({
      spyStartPrice: res.data[0].close,
      spyEndPrice: res.data[res.data.length - 1].close
    });
  };

  fetchCurrentStockData = async () => {
    const res = await axios.get(
      `https://api.iextrading.com/1.0/stock/${this.state.stockName}/price`
    );
    await this.setState({ currentPrice: res.data });
  };

  fetchStockData = () => {
    axios
      .get(
        `https://api.iextrading.com/1.0/stock/${this.state.stockName}/chart/5y`
      )
      .then(res => {
        let firstDay =
          new Date(res.data[0].date).getTime() / 1000 / 60 / 60 / 24;
        const data = res.data.map(item => [
          new Date(item.date).getTime() / 1000 / 60 / 60 / 24 - firstDay,
          item.close
        ]);

        const newData = [];
        for (let i = 0; i < data.length; i++) {
          if (i <= data[i][0]) newData.push([i, data[i][1]]);
        }
        return newData;
      })
      .then(data => {
        this.setState({
          startPrice: data[0][1]
        });
        const result = regression.linear(data);
        const regressionInfo = {
          equation: result.string,
          r: Math.sqrt(result.r2).toFixed(2),
          r2: result.r2.toFixed(2),
          x: result.equation[0],
          b: result.equation[1],
          prediction: (
            result.points.length * result.equation[0] +
            result.equation[1]
          ).toFixed(2),
          oneMonth: (
            (result.points.length + 21) * result.equation[0] +
            result.equation[1]
          ).toFixed(2)
        };
        this.setState({
          regressionInfo
        });
        return regressionInfo;
      });
  };

  renderForm = () => {
    return (
      <form
        className="form-entry"
        onSubmit={e => {
          e.preventDefault();
          this.fetchStockData();
          this.fetchCurrentStockData();
        }}
      >
        <label className="stock-name-label" htmlFor="stock-name">
          Stock Symbol:{" "}
        </label>
        <input
          className="stock-name-input"
          name="stock-name"
          type="text"
          value={this.state.stockName}
          onChange={e =>
            this.setState({
              stockName: e.target.value
            })
          }
        />
      </form>
    );
  };

  render() {
    const { stockName, regressionInfo } = this.state;

    const spyChange = (
      ((this.state.spyEndPrice - this.state.spyStartPrice) /
        this.state.spyEndPrice) *
      100
    ).toFixed(2);

    const stockChange = (
      ((this.state.currentPrice - this.state.startPrice) /
        this.state.currentPrice) *
      100
    ).toFixed(2);

    return (
      <div className="App">
        <h1 className="app-header">Find out Stock Performance</h1>
        {this.renderForm()}

        <div className="stock-info">
          <button
            className={`btn ${this.state.displayStatistics && `btn-active`}`}
            onClick={() =>
              this.setState({
                displayStatistics: !this.state.displayStatistics
              })
            }
          >
            {this.state.displayStatistics && `Hide statistics`}
            {!this.state.displayStatistics && `Show statistics`}
          </button>
          <button
            className={`btn ${this.state.displayPredictions && `btn-active`}`}
            onClick={() =>
              this.setState({
                displayPredictions: !this.state.displayPredictions
              })
            }
          >
            {this.state.displayPredictions && `Hide Predictions`}
            {!this.state.displayPredictions && `Show Predictions`}
          </button>

          <button
            className={`btn ${this.state.displayErrors && `btn-active`}`}
            onClick={() =>
              this.setState({
                displayErrors: !this.state.displayErrors
              })
            }
          >
            {this.state.displayErrors && `Hide Errors`}
            {!this.state.displayErrors && `Show Errors`}
          </button>

          <button
            className={`btn ${this.state.displayChanges && `btn-active`}`}
            onClick={() =>
              this.setState({
                displayChanges: !this.state.displayChanges
              })
            }
          >
            {this.state.displayChanges && `Hide Changes`}
            {!this.state.displayChanges && `Show Changes`}
          </button>

          <button
            className={`btn ${this.state.displayPerformance && `btn-active`}`}
            onClick={() =>
              this.setState({
                displayPerformance: !this.state.displayPerformance
              })
            }
          >
            {this.state.displayPerformance && `Hide Performance`}
            {!this.state.displayPerformance && `Show Performance`}
          </button>
          {this.state.displayStatistics && (
            <div className="statistics">
              <div className="equation">
                equation: <em>{regressionInfo["equation"]}</em>
              </div>
              <div className="x">
                slope: <em>{regressionInfo["x"]}</em>
              </div>
              <div className="b">
                intercept: <em>{regressionInfo["b"]}</em>
              </div>
              <div className="r">
                r: <em>{regressionInfo["r"]}</em>
              </div>
              <div className="r2">
                r2: <em>{regressionInfo["r2"]}</em>
              </div>
            </div>
          )}

          {this.state.displayPredictions && (
            <div className="predictions">
              <div className="prediction">
                current price prediction: ${regressionInfo["prediction"]}
              </div>
              <div className="prediction-1-month">
                Price in one month based on this model: $
                {regressionInfo["oneMonth"]}
              </div>
              <div className="actual-price">
                Actual Price: ${this.state.currentPrice}
              </div>
            </div>
          )}

          {this.state.displayErrors && (
            <div className="errors">
              <div className="error">
                Error:
                {regressionInfo["prediction"] - this.state.currentPrice >= 0
                  ? ` + `
                  : ` - `}
                {`$${Math.abs(
                  regressionInfo["prediction"] - this.state.currentPrice
                ).toFixed(2)}`}
              </div>
              <div className="error-percentage">
                Error Percentage:{" "}
                {`${(
                  (Math.abs(
                    regressionInfo["prediction"] - this.state.currentPrice
                  ).toFixed(2) /
                    this.state.currentPrice) *
                  100
                ).toFixed(2)}%`}
              </div>
            </div>
          )}

          {this.state.displayChanges && (
            <div className="changes">
              <div className="start-price">
                Start Price: ${this.state.startPrice}
              </div>

              <div className="end-price">
                End Price: ${this.state.currentPrice}
              </div>

              <div className="change-in-5">
                Change over 5 years: $
                {(this.state.currentPrice - this.state.startPrice).toFixed(2)}
              </div>
            </div>
          )}

          {this.state.displayPerformance && (
            <div className="performance">
              <div className="market-growth">
                How much the market grew during 5 years: {spyChange}%
              </div>

              <div className="stock-growth">
                How much the stock grew in 5 years: {stockChange}%
              </div>

              <div className="alpha">
                Alpha Coefficient: (How much this stock outperformed the
                market): {(stockChange - spyChange).toFixed(2)}%
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default App;
