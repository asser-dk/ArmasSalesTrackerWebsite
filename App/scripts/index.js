/* global $:false, console:false, moment:false, Chart:false */

function showProduct(productId)
{
    'use strict';
    console.log("Show product id " + productId);
    $.getJSON('http://api.apbsales.sexyfishhorse.com/products/' + productId).done(function (data)
    {
        var product = data.Product;
        var history = data.History;
        var latestPrice = history[0];
        history = history.reverse();
        var timestamps = [];
        var prices = [];
        var premiumPrices = [];

        var productModal = $('#product-modal');

        for (var i = 0; i < history.length; i++)
        {
            var item = history[i];
            timestamps.push(moment(item.Timestamp).calendar());
            prices.push(item.Price);
            premiumPrices.push(item.PremiumPrice);

            if (i === 0)
            {
                productModal.find('.period-from').text(moment(item.Timestamp).calendar());
            }

            if (i + 1 === history.length)
            {
                productModal.find('.period-to').text(moment(item.Timestamp).calendar());
            }
        }

        productModal.find('h2').text(product.Title);
        productModal.find('.product-image').attr('src', product.ImageUrl);
        productModal.find('.last-updated').text(moment(latestPrice.Timestamp).fromNow());
        productModal.find('.non-premium').text(latestPrice.Price + " G1C");
        productModal.find('.premium span').text(latestPrice.PremiumPrice + " G1C");
        productModal.find('a').attr('href', product.Url);

        var ctx = $('#price-chart').get(0).getContext("2d");

        var chartData = {
            labels: timestamps, datasets: [{
                label: 'Non premium price',
                fillColor: "rgba(67, 172, 106, 0.2)",
                strokeColor: "rgba(67, 172, 106, 1)",
                pointColor: "rgba(67, 172, 106, 1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(67, 172, 106, 1)",
                data: prices
            },
                {
                    label: 'Premium price',
                    fillColor: "rgba(240, 138, 36, 0.2)",
                    strokeColor: "rgba(240, 138, 36, 1)",
                    pointColor: "rgba(240, 138, 36, 1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(240, 138, 36, 1)",
                    data: premiumPrices
                }]
        };

        var chart = new Chart(ctx).Line(chartData,
            {
                scaleBeginAtZero: true,
                legendTemplate: '<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li style=\"color:<%=datasets[i].strokeColor%>\"><i class="fa fa-square"></i> <%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>'
            });

        var legend = chart.generateLegend();

        productModal.foundation('reveal', 'open');

        $('.chart-legend-container').html(legend);
    });
}

function showProducts(data)
{
    'use strict';
    if (data && data.length > 0)
    {
        $('.nothing-found').slideUp('fast', function ()
        {
            $('.found-products').slideDown('slow');
        });

        for (var i = 0; i < data.length; i++)
        {
            var dataEntry = data[i];
            var product = dataEntry.Product;
            var latestPrices = dataEntry.LatestPrices;
            var normalPrices = dataEntry.NormalPrices;

            var result = '<li><div class="product" id="' + product.Id +
                '"><img onload="fadeIn(this)" class="product-image" src="' + product.ImageUrl +
                '" alt="' + product.Title + '"/><h3>' + product.Title +
                '</h3><div class="prices"><div class="price">' + latestPrices.Price +
                ' G1C</div>';

            if (latestPrices.PremiumPrice > 0)
            {
                result += '<div class="price premium">' +
                '<i class="fa fa-star premium-star has-tip" data-tooltip aria-haspopup="true" title="Premium"></i> ' +
                latestPrices.PremiumPrice + ' G1C</div>';
            }

            result += '</div></div></li>';
            $(result).hide().prependTo('.product-results').slideDown('fast').delay(200);
        }

        $(document).foundation('tooltip', 'reflow');
    }
    else
    {
        $('.found-products').slideUp('fast', function ()
        {
            $('.nothing-found').slideDown('slow');
        });
    }
}

function showNothingFound(data)
{
    'use strict';
    console.error(data);
    $('.found-products').slideUp('fast', function ()
    {
        $('.nothing-found').slideDown('slow');
    });
}

function performSearch(e)
{
    'use strict';
    e.preventDefault();

    var productsModal = $('#products-modal');
    var hint = $('input[type="radio"][name="search-hint"]:checked').val();
    var text = $('#search-value').val();

    if (!hint || !text)
    {
        return;
    }

    $('.search-term').text(text);
    $('#result-search-value').val(text);
    if (!productsModal.is(':visible'))
    {
        productsModal.foundation('reveal', 'open');
    }

    $.post('http://api.apbsales.sexyfishhorse.com/products/search',
        JSON.stringify({'Term': text, 'Hint': hint})).done(showProducts).error(showNothingFound);

    $('.product-results').on('click', '.product', function ()
    {
        showProduct(this.id);
    });
}