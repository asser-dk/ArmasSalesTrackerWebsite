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
            var latest = dataEntry.Pricing.Latest;
            var normal = dataEntry.Pricing.Normal;

            var result = '<li><div class="product" id="' + product.Id + '">';
            result += '<img onload="fadeIn(this)" class="product-image" src="' + product.ImageUrl + '" alt="' +
            product.Title + '"/>';
            result += '<h3>' + product.Title + '</h3>';

            result += '<div class="prices">';

            // Price
            var normalPrice = normal.Price;
            var latestPrice = latest.Price;

            result += '<div class="price">';

            if (latestPrice < normalPrice)
            {
                var percentage = Math.round((1 - (latestPrice / normalPrice)) * 100);
                result += '<span class="normal discounted">' + normalPrice + ' G1C</span> ';
                result += '<span class="latest">' + latestPrice + ' G1C</span> ';
                result += '<span class="discount">Save <span class="percentage">' + percentage + '</span> %</span>';
            }
            else
            {
                result += '<span class="normal">' + normalPrice + ' G1C</span> ';
            }

            result += '</div>';

            // Premium
            if (latest.Premium > 0)
            {
                var normalPremium = normal.Premium;
                var latestPremium = latest.Premium;

                result += '<div class="price premium">';
                result += '<i class="fa fa-star premium-star has-tip" data-tooltip aria-haspopup="true" title="Premium"></i> ';

                if (latestPrice < normalPrice)
                {
                    result += '<span class="normal discounted">' + normalPremium + ' G1C</span> ';
                    var premiumPct = Math.round((1 - (latestPremium / normalPremium)) * 100);
                    result += '<span class="latest">' + latestPremium + ' G1C</span> ';
                    result += '<span class="discount">Save <span class="percentage">' + premiumPct + '</span> %</span>';
                }
                else
                {
                    result += '<span class="normal">' + normalPremium + ' G1C</span> ';
                }

                result += '</div>';
            }

            result += '</div>';
            result += '</div></li>';

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